import { Tempo, Difficulty, Position, PaceAdjustment } from '../types';

// ─── 3-Phase Timing Model ──────────────────────────────────────────────────────
//
// Every cycle = MOVEMENT_PHASE + recovery_travel + PAUSE_AT_T
//
//   [position call @ +500ms]
//   → player moves to position & plays phantom shot
//   [recovery cue @ MOVEMENT_PHASE_MS]
//   → player runs back to T (~RECOVERY_TRAVEL_MS)
//   [standing at T for PAUSE_AT_T_MS]
//   [next position call]
//
// MOVEMENT_PHASE_MS: time from loop-start until "Back to T!" fires.
// Player's time at position ≈ MOVEMENT_PHASE_MS − positionCallMs − sprint_time.
//   beginner/natural  → 4800 − 150 − 1500 ≈ 3.15 s at position  ✓
//   intermediate/natural → 4000 − 150 − 1200 ≈ 2.65 s  ✓
//   advanced/natural  → 3000 − 150 − 1000 ≈ 1.85 s  ✓
//   elite/natural     → 2400 − 150 −  800 ≈ 1.45 s  ✓
//   pro/natural       → 1700 − 150 −  600 ≈ 0.95 s  ✓
export const MOVEMENT_PHASE_MS: Record<Difficulty, Record<Tempo, number>> = {
  beginner:     { slow: 6500, natural: 4800, explosive: 3800 },
  intermediate: { slow: 5500, natural: 4000, explosive: 3100 },
  advanced:     { slow: 4200, natural: 3000, explosive: 2300 },
  elite:        { slow: 3300, natural: 2400, explosive: 1800 },
  pro:          { slow: 2700, natural: 1700, explosive: 1300 },
};

// Estimated time for player to jog back to T after recovery cue (documentation only)
const RECOVERY_TRAVEL_MS: Record<Difficulty, number> = {
  beginner: 1500, intermediate: 1200, advanced: 1000, elite: 800, pro: 600,
};

// Estimated pause AT T before next call (documentation only)
const PAUSE_AT_T_MS: Record<Difficulty, number> = {
  beginner: 1700, intermediate: 1300, advanced: 1000, elite: 800, pro: 900,
};

// TIMING_MATRIX = MOVEMENT_PHASE + RECOVERY_TRAVEL + PAUSE_AT_T
//   beginner/natural:      4800 + 1500 + 1700 =  8000 ms  (~ 8 s per rep — controlled pace)
//   intermediate/natural:  4000 + 1200 + 1300 =  6500 ms  (~6.5 s per rep — match-like)
//   advanced/natural:      3000 + 1100 + 1100 =  5200 ms  (~5.2 s per rep — rally pace)
//   elite/natural:         2400 +  800 +  800 =  4000 ms  (~ 4 s per rep — tournament)
//   pro/natural:           1800 +  700 +  950 =  3500 ms  (~3.5 s per rep — pro level)
//
// Players who need more T-pause time can use Settings → Movement Pace (+1s / +2s / +3s).
// Players who want faster: choose Explosive tempo or a higher difficulty.
export const TIMING_MATRIX: Record<Difficulty, Record<Tempo, number>> = {
  beginner:     { slow: 10000, natural: 8000, explosive: 6500 },
  intermediate: { slow:  8500, natural: 6500, explosive: 5200 },
  advanced:     { slow:  6700, natural: 5200, explosive: 4200 },
  elite:        { slow:  5200, natural: 4000, explosive: 3300 },
  pro:          { slow:  4600, natural: 3500, explosive: 2800 },
};

// ─── In-drill live pace control ───────────────────────────────────────────────
// 7 steps; index 3 = neutral (0 ms offset). Steps go from -3 s (Turbo) to
// +3 s (Recovery). Engine clamps to (MOVEMENT_PHASE + 400 ms) so the T-pose
// always clears before the next call even at the fastest setting.
// Ordered slow → fast so that + button (higher index) = faster pace.
export const PACE_STEPS_MS   = [3000, 2000, 1000, 0, -1000, -2000, -3000] as const;
export const PACE_STEP_LABELS = ['Recovery', 'Slow', 'Easy', 'Normal', 'Fast', 'Fast+', 'Turbo'] as const;
export const PACE_DEFAULT_STEP = 3;

// Gap between recovery cue firing and currentPosition clearing to display T pose.
// T-clear fires at min(movPhase+600, effectiveInterval-100) — always before next call.
export const T_POSE_CLEAR_DELAY_MS = 600;

// Extra movement-phase time per position — front corners require more time:
// player is deeper into the corner with a lower body position and tighter swing.
// Applied on top of MOVEMENT_PHASE_MS so the recovery cue fires later for these positions.
// The effectiveIntervalMs floor also includes this offset so the gap between the
// recovery cue and the next call stays consistent across all positions and speeds.
export const POSITION_PHASE_OFFSET_MS: Partial<Record<Position, number>> = {
  FL: 250, FR: 250,       // deep front corners
  FMCL: 100, FMCR: 100,  // front volley zone
};

// Match-sim progressive speed increase per 3 sets, scaled by difficulty.
// Beginners train at stable pace; higher levels face increasing pressure.
// Floored at 60% of base in all cases.
export const MATCH_SIM_STEP_RATE: Record<string, number> = {
  beginner:     0.00,   // no acceleration — beginners need consistent rhythm
  intermediate: 0.05,   // +5% per 3 sets
  advanced:     0.08,   // +8% per 3 sets
  elite:        0.10,   // +10% per 3 sets (original rate)
  pro:          0.12,   // +12% per 3 sets — maximum pressure
};

// Pause at T after "Go!" before the VERY FIRST position call of a set.
// Gives the player time to physically stand at T and compose themselves.
export const T_START_PAUSE_MS = 3000;

// ─── Within-Interval Audio Offsets (spec Part F4) ────────────────────────────
// All offsets relative to T+0 (moment position-call event fires).
// voiceCallMs=0: speech issued at T+0; iOS TTS startup ~150ms so voice arrives at T+150ms.
// positionCallMs=150: court visual fires at T+150ms — lands in sync with TTS arrival.
export const AUDIO_OFFSETS = {
  prepBeepMs: 0,          // preparation beep — fires at interval start
  positionCallMs: 150,    // court visual highlight + state update (was 300 — still felt sluggish)
  voiceCallMs: 0,         // speech issued at T+0; TTS startup (~150ms) brings audio in sync with visual
  courtHighlightMs: 150,  // court zone highlight animates on
  textOverlayMs: 200,     // voice text overlay fades in
  recoveryOffsetMs: 400,  // "recover to T" fires at (intervalMs − 400)
} as const;

// ─── Rest Logic (spec Part F5) ───────────────────────────────────────────────
// Per-difficulty rest factors — higher levels get proportionally less rest
// to maintain training intensity and avoid breaking rhythm.
// Resulting rest at natural tempo: beginner ~25s, intermediate ~20s,
// advanced ~17s, elite ~14s, pro ~14s (≈5:1 work:rest).
// Pro raised from 0.14 → 0.18 to bring work:rest from 7:1 to ~5:1,
// which is the upper limit of evidence-based elite conditioning protocols.
export const AUTO_REST_FACTORS: Record<Difficulty, number> = {
  beginner:     0.40,
  intermediate: 0.28,
  advanced:     0.22,
  elite:        0.18,
  pro:          0.18,
};

// Moves per set before triggering a rest break (derived from difficulty)
export const MOVES_PER_SET: Record<Difficulty, number> = {
  beginner:     8,
  intermediate: 12,
  advanced:     16,
  elite:        20,
  pro:          25,
};

// Minimum rest in ms even in auto mode (keeps transitions human-friendly)
export const MIN_REST_MS = 2000;

// ─── Countdown & Checkpointing ───────────────────────────────────────────────
export const COUNTDOWN_SECONDS = 3;
export const CHECKPOINT_INTERVAL_MS = 15_000;
export const RESUME_MAX_AGE_HOURS = 4;

// ─── Distance-Based Dynamic Timing Model ─────────────────────────────────────
// Replaces flat TIMING_MATRIX with position-aware interval calculation.
//
// Total interval = travel_to_pos + dwell_at_pos + recovery_travel + pause_at_T
//   travel_to_pos   = dist / (sprint × tempo_factor)
//   recovery_travel = dist / (sprint × tempo_factor × 0.72)   ← jog back = 72% sprint
//   Combined travel = dist × TRAVEL_K / effective_speed
//   TRAVEL_K = (1 + 1/0.72) × 1000 ≈ 2389
//
// Results (Elite / natural / BL-BR at 4.79m):
//   travel ≈ 2544ms + dwell 330ms + pause 400ms ≈ 3274ms  ✓ realistic

const T_X = 0;
const T_Z = 4.26;

const POSITION_COORDS_M: Record<string, [number, number]> = {
  FL:   [-2.20, 1.00],
  FR:   [ 2.20, 1.00],
  ML:   [-2.00, 4.60],
  MR:   [ 2.00, 4.60],
  BL:   [-2.20, 8.50],
  BR:   [ 2.20, 8.50],
  FMCL: [-2.00, 2.80],
  FMCR: [ 2.00, 2.80],
  BMCL: [-2.00, 6.50],
  BMCR: [ 2.00, 6.50],
  T:    [ 0.00, 4.26],
};

const TRAVEL_K = (1 + 1 / 0.72) * 1000; // ≈ 2389 ms·s/m

const SPRINT_MPS: Record<Difficulty, number> = {
  beginner: 2.7, intermediate: 3.2, advanced: 3.8, elite: 4.5, pro: 5.0,
};

const TEMPO_FACTOR: Record<Tempo, number> = {
  slow: 0.80, natural: 1.00, explosive: 1.25,
};

// Time at position: approach, execute phantom shot, begin recovery push-off.
// Calibrated so getDynamicIntervalMs('ML', diff, 'natural') ≈ TIMING_MATRIX[diff]['natural'].
// Scaled by 1/TEMPO_FACTOR at call time so slow tempo gives more dwell, explosive gives less.
// Advanced raised 2400→2500 and Pro raised 1450→1650 so phantom-shot execution feels
// realistic and less mechanical at those difficulty levels.
const DWELL_AT_POS: Record<Difficulty, number> = {
  beginner: 4000, intermediate: 3200, advanced: 2500, elite: 1900, pro: 1650,
};

// Standing at T between recovery and next position call.
// Also scaled by 1/TEMPO_FACTOR: slow=more breathing room, explosive=shorter pause.
// Advanced raised 1300→1400, Pro raised 780→950 to give a clear recovery beat at T
// and make the Pro pace feel achievable rather than frantic.
const T_PAUSE: Record<Difficulty, number> = {
  beginner: 2200, intermediate: 1800, advanced: 1400, elite: 1000, pro: 950,
};

// Hard floor per tempo — set to TIMING_MATRIX[diff]['natural'] / TEMPO_FACTOR[tempo].
// This prevents close positions (ML/T area) from going faster than validated natural pace.
// Computed dynamically in getDynamicIntervalMs; stored here as the natural baseline.
// advanced: 1277 + 2500 + 1400 = 5177 → 5100 floor  pro: 970 + 1650 + 950 = 3570 → 3500 floor
const MIN_INTERVAL: Record<Difficulty, number> = {
  beginner: 8000, intermediate: 6500, advanced: 5100, elite: 4000, pro: 3500,
};

// Pace-preset multipliers + fine-step factor
const PACE_PRESET_MUL: Record<string, number> = { slow: 1.30, normal: 1.00, fast: 0.82 };
const FINE_STEP_FACTOR = 0.08; // 8% per fine step; positive = slower

export function distanceFromT(pos: string): number {
  const c = POSITION_COORDS_M[pos];
  if (!c) return 3.0;
  return Math.sqrt((c[0] - T_X) ** 2 + (c[1] - T_Z) ** 2);
}

export function paceMultiplier(adj?: PaceAdjustment): number {
  if (!adj) return 1.0;
  const base = PACE_PRESET_MUL[adj.preset] ?? 1.0;
  return base * (1 + adj.fineSteps * FINE_STEP_FACTOR);
}

/**
 * Full cycle duration for a given position — the primary engine timing primitive.
 *
 * DWELL and T_PAUSE are scaled by 1/TEMPO_FACTOR so that:
 *   slow (0.80×)     → DWELL × 1.25, T_PAUSE × 1.25  (more time at position + at T)
 *   natural (1.00×)  → unchanged
 *   explosive (1.25×)→ DWELL × 0.80, T_PAUSE × 0.80  (snappy touch-and-go rhythm)
 *
 * Calibration target: getDynamicIntervalMs('ML', diff, 'natural') ≈ TIMING_MATRIX[diff]['natural'].
 * Far positions (BL/BR ~4.79 m) will exceed this floor — that is intentional and correct.
 */
export function getDynamicIntervalMs(
  position: string,
  difficulty: Difficulty,
  tempo: Tempo,
  adj?: PaceAdjustment,
): number {
  const dist    = distanceFromT(position);
  const speed   = SPRINT_MPS[difficulty] * TEMPO_FACTOR[tempo];
  const tf      = TEMPO_FACTOR[tempo];
  const travel  = (dist * TRAVEL_K) / speed;
  const dwell   = DWELL_AT_POS[difficulty] / tf;
  const tPause  = T_PAUSE[difficulty] / tf;
  const raw     = travel + dwell + tPause;
  const minMs   = Math.round(MIN_INTERVAL[difficulty] / tf);
  const floored = Math.max(minMs, Math.round(raw));
  const result  = Math.round(floored * paceMultiplier(adj));
  // Safety net: NaN from a corrupted lookup table, or extreme pace adjustment reducing
  // the interval below 500 ms, would cause setTimeout cascades. Clamp to a hard floor.
  return Number.isFinite(result) ? Math.max(500, result) : minMs;
}

/**
 * Movement phase duration — time from call to recovery cue firing.
 * = forward sprint + tempo-scaled dwell at position.
 * DWELL is scaled by 1/TEMPO_FACTOR to match the getDynamicIntervalMs contract.
 */
export function getDynamicMovementPhaseMs(
  position: string,
  difficulty: Difficulty,
  tempo: Tempo,
  adj?: PaceAdjustment,
): number {
  const dist   = distanceFromT(position);
  const speed  = SPRINT_MPS[difficulty] * TEMPO_FACTOR[tempo];
  const tf     = TEMPO_FACTOR[tempo];
  const sprint = (dist / speed) * 1000;
  const dwell  = DWELL_AT_POS[difficulty] / tf;
  const raw    = sprint + dwell;
  return Math.round(raw * paceMultiplier(adj));
}

// ─── Helper functions ─────────────────────────────────────────────────────────

/** Backward-compatible flat lookup — uses ML as the representative mid-court distance. */
export function getIntervalMs(difficulty: Difficulty, tempo: Tempo, adj?: PaceAdjustment): number {
  return getDynamicIntervalMs('ML', difficulty, tempo, adj);
}

export function getRecoveryMs(intervalMs: number): number {
  return Math.max(0, intervalMs - AUDIO_OFFSETS.recoveryOffsetMs);
}

export function getAutoRestMs(difficulty: Difficulty, movesPerSet: number, intervalMs: number): number {
  const factor = AUTO_REST_FACTORS[difficulty];
  const setDurationMs = movesPerSet * intervalMs;
  return Math.max(MIN_REST_MS, Math.round(setDurationMs * factor));
}

export function estimateTotalMoves(
  durationMinutes: number,
  difficulty: Difficulty,
  tempo: Tempo,
  adj?: PaceAdjustment,
): number {
  // Use a weighted average across the six standard positions rather than only ML
  // so corner-heavy sessions (with longer BL/BR intervals) are not over-estimated.
  const STD_POSITIONS = ['FL', 'FR', 'ML', 'MR', 'BL', 'BR'];
  const intervalMs = Math.round(
    STD_POSITIONS.reduce((sum, p) => sum + getDynamicIntervalMs(p, difficulty, tempo, adj), 0) / STD_POSITIONS.length
  );
  const movesPerSet = MOVES_PER_SET[difficulty];
  const restMs      = getAutoRestMs(difficulty, movesPerSet, intervalMs);
  const setMs       = movesPerSet * intervalMs + restMs;
  const totalMs     = durationMinutes * 60_000;
  const sets        = Math.floor(totalMs / setMs);
  return sets * movesPerSet + Math.min(movesPerSet, Math.floor((totalMs % setMs) / intervalMs));
}
