import { SessionConfig, Position } from '../types';
import {
  POSITIONS_6PT, POSITIONS_10PT,
  FIXED_ORDER_6PT, FIXED_ORDER_10PT,
  COVERAGE_FILTER, HAND_MIRROR,
  getPositionsForSystem,
} from '../constants/positions';
import {
  getIntervalMs, getShotCallMs, getRecoveryMs, MOVES_PER_SET, estimateTotalMoves,
} from '../constants/timing';
import { getShotsForPosition, pickShot } from './positionShotMatrix';

// ─── Public interface ─────────────────────────────────────────────────────────

export interface SessionMove {
  position: Position;
  shot: string | null;
  intervalMs: number;
  shotCallMs: number | null;   // null = movement-only drill
  recoveryMs: number;
  setIndex: number;
  moveIndex: number;
}

export interface GhostingEngine {
  /** Advance and return the next move. Rolls over to a new set automatically. */
  getNextMove(): SessionMove;
  /** Look at the next position without advancing the pointer. */
  peekNextPosition(): Position | null;
  /** True when all moves in the current set have been returned. */
  isSetComplete(): boolean;
  getSetIndex(): number;
  getMoveIndex(): number;
  /** Estimated total moves for the full session duration. */
  estimatedTotalMoves(): number;
  /** Reset to the start of set 0 (used for resume / re-run). */
  reset(): void;
}

// ─── Match simulation rally templates (spec Part H) ──────────────────────────
// Each entry is the ordered list of destination positions (T implied between each).

const MATCH_SIM_PATTERNS_6PT: Position[][] = [
  ['BR', 'FR', 'BL', 'FL'],             // Drive-Drop Rally
  ['BL', 'FR', 'BR', 'FL'],             // Boast-Drive
  ['BR', 'FL', 'BR', 'FL', 'BR', 'FL'], // Boast-Drop-Drive (extended)
  ['BR', 'FL', 'BR', 'FL'],             // Cross-Court Rally
  ['BR', 'BR', 'FL', 'BL'],             // Drive-Drive-Boast
  ['FR', 'BR', 'FL', 'BL'],             // Front-Back Blitz
];

const MATCH_SIM_PATTERNS_10PT: Position[][] = [
  ...MATCH_SIM_PATTERNS_6PT,
  ['BMCR', 'FMCL', 'BMCL', 'FMCR'],    // Pressure Rally (10pt only)
  ['FMCR', 'BL', 'FMCL', 'BR'],         // Volley-Drive
];

// ─── Private helpers ──────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Fisher-Yates with no consecutive repeats. */
function shuffleNoRepeat(pool: Position[], count: number): Position[] {
  const result: Position[] = [];
  let last: Position | null = null;
  const p = shuffle(pool);

  for (let i = 0; i < count; i++) {
    let pos = p[i % p.length];
    // Swap with the next slot if it repeats
    if (pos === last && p.length > 1) {
      const next = (i + 1) % p.length;
      [p[i % p.length], p[next]] = [p[next], p[i % p.length]];
      pos = p[i % p.length];
    }
    result.push(pos);
    last = pos;
  }
  return result;
}

function buildPool(config: SessionConfig): Position[] {
  const base = getPositionsForSystem(config.courtSystem);
  const filter = (COVERAGE_FILTER[config.coverage] ?? base) as Position[];

  let pool = base.filter((p) => filter.includes(p));

  // Mirror left↔right for left-handed players
  if (config.dominantHand === 'left') {
    pool = pool.map((p) => HAND_MIRROR[p]);
  }

  return pool.length >= 2 ? pool : base.slice(0, 2);
}

function fixedSet(config: SessionConfig, pool: Position[], count: number): Position[] {
  const order = config.courtSystem === '6pt' ? FIXED_ORDER_6PT : FIXED_ORDER_10PT;
  const filtered = order.filter((p) => pool.includes(p));
  if (filtered.length === 0) return shuffleNoRepeat(pool, count);

  return Array.from({ length: count }, (_, i) => filtered[i % filtered.length]);
}

function matchSimSet(config: SessionConfig, pool: Position[], count: number): Position[] {
  const templates =
    config.courtSystem === '10pt' ? MATCH_SIM_PATTERNS_10PT : MATCH_SIM_PATTERNS_6PT;

  const compatible = templates.filter((t) => t.every((p) => pool.includes(p)));
  if (compatible.length === 0) return shuffleNoRepeat(pool, count);

  const pattern = compatible[Math.floor(Math.random() * compatible.length)];
  return Array.from({ length: count }, (_, i) => pattern[i % pattern.length]);
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createGhostingEngine(config: SessionConfig): GhostingEngine {
  const baseIntervalMs = getIntervalMs(config.difficulty, config.tempo);
  const movesPerSet    = MOVES_PER_SET[config.difficulty];
  const pool           = buildPool(config);

  let setIndex  = 0;
  let moveIndex = 0;
  let sequence: Position[] = [];

  function effectiveInterval(): number {
    if (config.patternType !== 'match-sim') return baseIntervalMs;
    // Spec: +10% speed every 3 sets in match simulation (floored at 60% of base)
    const reduction = Math.floor(setIndex / 3) * 0.10;
    return Math.max(baseIntervalMs * 0.60, baseIntervalMs * (1 - reduction));
  }

  function buildSet(): Position[] {
    switch (config.patternType) {
      case 'fixed':      return fixedSet(config, pool, movesPerSet);
      case 'random':
      case 'shot-based': return shuffleNoRepeat(pool, movesPerSet);
      case 'match-sim':  return matchSimSet(config, pool, movesPerSet);
      default:           return shuffleNoRepeat(pool, movesPerSet);
    }
  }

  // Initialise first set
  sequence = buildSet();

  return {
    getNextMove(): SessionMove {
      // Roll over to new set if current one is exhausted
      if (moveIndex >= sequence.length) {
        setIndex++;
        moveIndex = 0;
        sequence = buildSet();
      }

      const position    = sequence[moveIndex];
      const interval    = effectiveInterval();

      // Shot selection for non-movement drills.
      // For left-handed players the pool was mirrored (e.g. FL = their forehand corner).
      // The shot matrix is keyed on the right-handed layout (FR=forehand, FL=backhand).
      // Unmirror the position before the shot lookup so labels match the player's hand.
      let shot: string | null = null;
      if (config.drillType !== 'movement') {
        const shotLookupPos = config.dominantHand === 'left' ? HAND_MIRROR[position] : position;
        const shots = getShotsForPosition(shotLookupPos, config.shotGroups);
        const entry = pickShot(shots);
        shot = entry?.voiceText ?? null;
      }

      const move: SessionMove = {
        position,
        shot,
        intervalMs:  interval,
        shotCallMs:  shot ? getShotCallMs(interval) : null,
        recoveryMs:  getRecoveryMs(interval),
        setIndex,
        moveIndex,
      };

      moveIndex++;
      return move;
    },

    peekNextPosition(): Position | null {
      if (moveIndex < sequence.length) return sequence[moveIndex];
      // Peek into what the next set would start with
      const next = buildSet();
      return next[0] ?? null;
    },

    isSetComplete():        boolean  { return moveIndex >= sequence.length; },
    getSetIndex():          number   { return setIndex; },
    getMoveIndex():         number   { return moveIndex; },
    estimatedTotalMoves(): number   { return estimateTotalMoves(config.duration, config.difficulty, config.tempo); },

    reset(): void {
      setIndex  = 0;
      moveIndex = 0;
      sequence  = buildSet();
    },
  };
}
