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
//   beginner/natural  → 7200 − 500 − 1800 ≈ 4.9 s at position  ✓
//   intermediate/natural → 6000 − 500 − 1500 ≈ 4.0 s  ✓
//   advanced/natural  → 4800 − 500 − 1200 ≈ 3.1 s  ✓
//   elite/natural     → 3900 − 500 − 900  ≈ 2.5 s  ✓
//   pro/natural       → 3200 − 500 − 700  ≈ 2.0 s  ✓
export const MOVEMENT_PHASE_MS: Record<Difficulty, Record<Tempo, number>> = {
  beginner:     { slow: 9200, natural: 7200, explosive: 5800 },
  intermediate: { slow: 7600, natural: 6000, explosive: 4800 },
  advanced:     { slow: 6100, natural: 4800, explosive: 3900 },
  elite:        { slow: 4900, natural: 3900, explosive: 3100 },
  pro:          { slow: 4000, natural: 3200, explosive: 2600 },
};

// Estimated time for player to jog back to T after recovery cue (documentation only)
const RECOVERY_TRAVEL_MS: Record<Difficulty, number> = {
  beginner: 1800, intermediate: 1500, advanced: 1200, elite: 900, pro: 700,
};

// Estimated pause AT T before next call (documentation only)
const PAUSE_AT_T_MS: Record<Difficulty, number> = {
  beginner: 3000, intermediate: 2500, advanced: 2000, elite: 1700, pro: 1300,
};

// TIMING_MATRIX = MOVEMENT_PHASE + RECOVERY_TRAVEL + PAUSE_AT_T
//   beginner/natural:      7200 + 1800 + 3000 = 12000 ms  (~12 s per rep)
//   intermediate/natural:  6000 + 1500 + 2500 = 10000 ms  (~10 s per rep)
//   advanced/natural:      4800 + 1200 + 2000 =  8000 ms  (~ 8 s per rep)
//   elite/natural:         3900 +  900 + 1700 =  6500 ms  (~6.5 s per rep)
//   pro/natural:           3200 +  700 + 1300 =  5200 ms  (~5.2 s per rep)
//
// Players who need more T-pause time can use Settings → Movement Pace (+1s / +2s / +3s).
// Players who want faster: choose Explosive tempo or a higher difficulty.
export const TIMING_MATRIX: Record<Difficulty, Record<Tempo, number>> = {
  beginner:     { slow: 15000, natural: 12000, explosive: 10000 },
  intermediate: { slow: 12500, natural: 10000, explosive:  8000 },
  advanced:     { slow: 10000, natural:  8000, explosive:  6500 },
  elite:        { slow:  8000, natural:  6500, explosive:  5200 },
  pro:          { slow:  6500, natural:  5200, explosive:  4200 },
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
// Small buffer lets the audio phrase begin before the visual transitions.
export const T_POSE_CLEAR_DELAY_MS = 1000;

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
  shotCallFactor: 0.55,   // shot call fires at (intervalMs × 0.55)
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

export function getShotCallMs(intervalMs: number): number {
  return Math.round(intervalMs * AUDIO_OFFSETS.shotCallFactor);
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
  tempo: Tempo
): number {
  const intervalMs = getIntervalMs(difficulty, tempo);
  const movesPerSet = MOVES_PER_SET[difficulty];
  const restMs = getAutoRestMs(movesPerSet, intervalMs);
  const setDurationMs = movesPerSet * intervalMs + restMs;
  const totalMs = durationMinutes * 60_000;
  const sets = Math.floor(totalMs / setDurationMs);
  return sets * movesPerSet + Math.min(movesPerSet, Math.floor((totalMs % setDurationMs) / intervalMs));
}
