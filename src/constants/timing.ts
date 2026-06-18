import { Tempo, Difficulty } from '../types';

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
//   beginner/natural  → 4800 − 500 − 1500 ≈ 2.8 s at position  ✓
//   intermediate/natural → 4000 − 500 − 1200 ≈ 2.3 s  ✓
//   advanced/natural  → 3000 − 500 − 1000 ≈ 1.5 s  ✓
//   elite/natural     → 2400 − 500 −  800 ≈ 1.1 s  ✓
//   pro/natural       → 1700 − 500 −  600 ≈ 0.6 s  ✓
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
//   advanced/natural:      3000 + 1000 + 1000 =  5000 ms  (~ 5 s per rep — rally pace)
//   elite/natural:         2400 +  800 +  800 =  4000 ms  (~ 4 s per rep — tournament)
//   pro/natural:           1700 +  600 +  900 =  3200 ms  (~3.2 s per rep — pro level)
//
// Players who need more T-pause time can use Settings → Movement Pace (+1s / +2s / +3s).
// Players who want faster: choose Explosive tempo or a higher difficulty.
export const TIMING_MATRIX: Record<Difficulty, Record<Tempo, number>> = {
  beginner:     { slow: 10000, natural: 8000, explosive: 6500 },
  intermediate: { slow:  8500, natural: 6500, explosive: 5200 },
  advanced:     { slow:  6500, natural: 5000, explosive: 4000 },
  elite:        { slow:  5200, natural: 4000, explosive: 3300 },
  pro:          { slow:  4200, natural: 3200, explosive: 2800 },
};

// ─── In-drill live pace control ───────────────────────────────────────────────
// 7 steps; index 3 = neutral (0 ms offset). Steps go from -3 s (Turbo) to
// +3 s (Recovery). Engine clamps to (MOVEMENT_PHASE + 1500 ms) so the T-pose
// always clears before the next call even at the fastest setting.
// Ordered slow → fast so that + button (higher index) = faster pace.
export const PACE_STEPS_MS   = [3000, 2000, 1000, 0, -1000, -2000, -3000] as const;
export const PACE_STEP_LABELS = ['Recovery', 'Slow', 'Easy', 'Normal', 'Fast', 'Fast+', 'Turbo'] as const;
export const PACE_DEFAULT_STEP = 3;

// Gap between recovery cue firing and currentPosition clearing to display T pose.
// Reduced to 600ms so the live pace clamp (movementPhase + 800) stays safe:
// T-clear fires at min(movPhase+600, effectiveInterval-100) — always before next call.
export const T_POSE_CLEAR_DELAY_MS = 600;

// Pause at T after "Go!" before the VERY FIRST position call of a set.
// Gives the player time to physically stand at T and compose themselves.
export const T_START_PAUSE_MS = 3000;

// ─── Within-Interval Audio Offsets (spec Part F4) ────────────────────────────
// All offsets relative to T+0 (moment position-call event fires).
export const AUDIO_OFFSETS = {
  prepBeepMs: 0,          // preparation beep — fires at interval start
  positionCallMs: 500,    // court visual highlight + state update
  voiceCallMs: 350,       // voice fires 150ms before visual to offset TTS startup latency (~150ms on iOS)
  courtHighlightMs: 500,  // court zone highlight animates on
  textOverlayMs: 550,     // voice text overlay fades in
  shotCallFactor: 0.55,       // default: shot call fires at (intervalMs × 0.55)
  shotCallFactorFast: 0.65,  // for intervals < 5 s — player needs more time to arrive
  recoveryOffsetMs: 400,  // "recover to T" fires at (intervalMs − 400)
} as const;

// ─── Rest Logic (spec Part F5) ───────────────────────────────────────────────
export const AUTO_REST_FACTOR = 0.40;  // rest = 40% of set duration

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
export const RESUME_MAX_AGE_HOURS = 24;

// ─── Helper functions ─────────────────────────────────────────────────────────

export function getIntervalMs(difficulty: Difficulty, tempo: Tempo): number {
  return TIMING_MATRIX[difficulty][tempo];
}

// BUG-015: use the higher factor for fast intervals so the shot call doesn't
// fire before the player has arrived and settled at the position.
export function getShotCallMs(intervalMs: number): number {
  const factor = intervalMs < 5000 ? AUDIO_OFFSETS.shotCallFactorFast : AUDIO_OFFSETS.shotCallFactor;
  return Math.round(intervalMs * factor);
}

export function getRecoveryMs(intervalMs: number): number {
  return Math.max(0, intervalMs - AUDIO_OFFSETS.recoveryOffsetMs);
}

export function getAutoRestMs(movesPerSet: number, intervalMs: number): number {
  const setDurationMs = movesPerSet * intervalMs;
  return Math.max(MIN_REST_MS, Math.round(setDurationMs * AUTO_REST_FACTOR));
}

export function estimateTotalMoves(
  durationMinutes: number,
  difficulty: Difficulty,
  tempo: Tempo,
  movementPaceExtraMs = 0,
): number {
  const intervalMs = getIntervalMs(difficulty, tempo) + movementPaceExtraMs;
  const movesPerSet = MOVES_PER_SET[difficulty];
  const restMs = getAutoRestMs(movesPerSet, intervalMs);
  const setDurationMs = movesPerSet * intervalMs + restMs;
  const totalMs = durationMinutes * 60_000;
  const sets = Math.floor(totalMs / setDurationMs);
  return sets * movesPerSet + Math.min(movesPerSet, Math.floor((totalMs % setDurationMs) / intervalMs));
}
