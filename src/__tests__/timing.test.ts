/**
 * Timing Engine Tests
 *
 * Pure-logic tests — no mocks, no device needed. These run in Node.js with Jest.
 * They protect the most critical invariants of the training timing model:
 *   - Intervals are always finite positive numbers
 *   - Intervals never fall below the 500ms safety floor
 *   - Movement phase is always shorter than the full interval
 *   - estimateTotalMoves produces reasonable counts for known session durations
 *   - PACE_STEPS_MS never produces sub-floor intervals at any combination
 */

import {
  getDynamicIntervalMs,
  getDynamicMovementPhaseMs,
  estimateTotalMoves,
  PACE_STEPS_MS,
  TIMING_MATRIX,
  distanceFromT,
  paceMultiplier,
} from '../constants/timing';

const DIFFICULTIES = ['beginner', 'intermediate', 'advanced', 'elite', 'pro'] as const;
const TEMPOS       = ['slow', 'natural', 'explosive'] as const;
const POSITIONS    = ['FL', 'FR', 'ML', 'MR', 'BL', 'BR', 'FMCL', 'FMCR', 'BMCL', 'BMCR', 'T'] as const;

// ─── getDynamicIntervalMs ─────────────────────────────────────────────────────

describe('getDynamicIntervalMs', () => {
  test.each(DIFFICULTIES)('returns finite positive number for all tempos at difficulty=%s', (diff) => {
    for (const tempo of TEMPOS) {
      for (const pos of POSITIONS) {
        const ms = getDynamicIntervalMs(pos, diff, tempo);
        expect(Number.isFinite(ms)).toBe(true);
        expect(ms).toBeGreaterThan(0);
      }
    }
  });

  test('never returns less than 500ms (safety floor)', () => {
    for (const diff of DIFFICULTIES) {
      for (const tempo of TEMPOS) {
        for (const pos of POSITIONS) {
          const ms = getDynamicIntervalMs(pos, diff, tempo);
          expect(ms).toBeGreaterThanOrEqual(500);
        }
      }
    }
  });

  test('pro/explosive T position is at or above floor', () => {
    const ms = getDynamicIntervalMs('T', 'pro', 'explosive');
    expect(ms).toBeGreaterThanOrEqual(500);
    expect(Number.isFinite(ms)).toBe(true);
  });

  test('returns consistent result (deterministic)', () => {
    const a = getDynamicIntervalMs('BL', 'elite', 'natural');
    const b = getDynamicIntervalMs('BL', 'elite', 'natural');
    expect(a).toBe(b);
  });

  test('BL/BR (far positions) interval >= ML interval at same difficulty/tempo', () => {
    for (const diff of DIFFICULTIES) {
      for (const tempo of TEMPOS) {
        const mlMs = getDynamicIntervalMs('ML', diff, tempo);
        const blMs = getDynamicIntervalMs('BL', diff, tempo);
        const brMs = getDynamicIntervalMs('BR', diff, tempo);
        expect(blMs).toBeGreaterThanOrEqual(mlMs);
        expect(brMs).toBeGreaterThanOrEqual(mlMs);
      }
    }
  });

  test('slower difficulty gives longer interval than faster at same position/tempo', () => {
    const beginner = getDynamicIntervalMs('ML', 'beginner', 'natural');
    const advanced = getDynamicIntervalMs('ML', 'advanced', 'natural');
    const pro      = getDynamicIntervalMs('ML', 'pro',      'natural');
    expect(beginner).toBeGreaterThan(advanced);
    expect(advanced).toBeGreaterThan(pro);
  });

  test('PACE_STEPS_MS offsets never push any interval below 500ms', () => {
    for (const diff of DIFFICULTIES) {
      for (const tempo of TEMPOS) {
        for (const pos of POSITIONS) {
          for (const step of PACE_STEPS_MS) {
            const base = getDynamicIntervalMs(pos, diff, tempo);
            // Simulate effectiveIntervalMs as used in useSessionEngine
            const effective = Math.max(
              getDynamicMovementPhaseMs(pos, diff, tempo) + 400,
              base + step,
            );
            expect(effective).toBeGreaterThanOrEqual(500);
          }
        }
      }
    }
  });

  test('NaN input for unknown position falls back gracefully (uses distanceFromT default 3.0m)', () => {
    const ms = getDynamicIntervalMs('UNKNOWN_POS', 'intermediate', 'natural');
    expect(Number.isFinite(ms)).toBe(true);
    expect(ms).toBeGreaterThan(0);
  });
});

// ─── getDynamicMovementPhaseMs ────────────────────────────────────────────────

describe('getDynamicMovementPhaseMs', () => {
  test('movement phase is always less than full interval', () => {
    for (const diff of DIFFICULTIES) {
      for (const tempo of TEMPOS) {
        for (const pos of POSITIONS) {
          const phase    = getDynamicMovementPhaseMs(pos, diff, tempo);
          const interval = getDynamicIntervalMs(pos, diff, tempo);
          expect(phase).toBeLessThan(interval);
        }
      }
    }
  });

  test('returns finite positive number', () => {
    for (const diff of DIFFICULTIES) {
      for (const tempo of TEMPOS) {
        const phase = getDynamicMovementPhaseMs('BL', diff, tempo);
        expect(Number.isFinite(phase)).toBe(true);
        expect(phase).toBeGreaterThan(0);
      }
    }
  });
});

// ─── estimateTotalMoves ───────────────────────────────────────────────────────

describe('estimateTotalMoves', () => {
  test('30-minute beginner natural session gives reasonable move count (≥60, ≤200)', () => {
    const moves = estimateTotalMoves(30, 'beginner', 'natural');
    expect(moves).toBeGreaterThanOrEqual(60);
    expect(moves).toBeLessThanOrEqual(200);
  });

  test('45-minute intermediate natural session gives reasonable move count', () => {
    const moves = estimateTotalMoves(45, 'intermediate', 'natural');
    expect(moves).toBeGreaterThanOrEqual(150);
    expect(moves).toBeLessThanOrEqual(600);
  });

  test('60-minute pro explosive session gives more moves than 60-minute beginner slow', () => {
    const proPace  = estimateTotalMoves(60, 'pro',      'explosive');
    const begPace  = estimateTotalMoves(60, 'beginner', 'slow');
    expect(proPace).toBeGreaterThan(begPace);
  });

  test('longer sessions yield more moves than shorter at same config', () => {
    const m30 = estimateTotalMoves(30, 'intermediate', 'natural');
    const m60 = estimateTotalMoves(60, 'intermediate', 'natural');
    expect(m60).toBeGreaterThan(m30);
  });

  test('returns integer (no fractional moves)', () => {
    const moves = estimateTotalMoves(45, 'advanced', 'natural');
    expect(Number.isInteger(moves)).toBe(true);
  });
});

// ─── TIMING_MATRIX integrity ──────────────────────────────────────────────────

describe('TIMING_MATRIX', () => {
  test('all values are finite positive numbers', () => {
    for (const diff of DIFFICULTIES) {
      for (const tempo of TEMPOS) {
        const val = TIMING_MATRIX[diff][tempo];
        expect(Number.isFinite(val)).toBe(true);
        expect(val).toBeGreaterThan(0);
      }
    }
  });

  test('slower tempo gives longer interval than faster at each difficulty', () => {
    for (const diff of DIFFICULTIES) {
      expect(TIMING_MATRIX[diff]['slow']).toBeGreaterThan(TIMING_MATRIX[diff]['natural']);
      expect(TIMING_MATRIX[diff]['natural']).toBeGreaterThan(TIMING_MATRIX[diff]['explosive']);
    }
  });
});

// ─── distanceFromT ────────────────────────────────────────────────────────────

describe('distanceFromT', () => {
  test('T position has zero distance', () => {
    expect(distanceFromT('T')).toBe(0);
  });

  test('back corners are farther than front corners', () => {
    const bl = distanceFromT('BL');
    const fl = distanceFromT('FL');
    expect(bl).toBeGreaterThan(fl);
  });

  test('unknown position returns default 3.0m', () => {
    expect(distanceFromT('UNKNOWN')).toBe(3.0);
  });
});

// ─── paceMultiplier ───────────────────────────────────────────────────────────

describe('paceMultiplier', () => {
  test('undefined adjustment returns 1.0', () => {
    expect(paceMultiplier(undefined)).toBe(1.0);
  });

  test('slow preset returns multiplier > 1', () => {
    expect(paceMultiplier({ preset: 'slow', fineSteps: 0 })).toBeGreaterThan(1.0);
  });

  test('fast preset returns multiplier < 1', () => {
    expect(paceMultiplier({ preset: 'fast', fineSteps: 0 })).toBeLessThan(1.0);
  });

  test('normal preset with zero fineSteps returns 1.0', () => {
    expect(paceMultiplier({ preset: 'normal', fineSteps: 0 })).toBe(1.0);
  });
});
