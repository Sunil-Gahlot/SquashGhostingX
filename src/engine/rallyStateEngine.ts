import { ShotEntry, Position } from '../types';

// ─── Rally Phase Types ────────────────────────────────────────────────────────

/**
 * Four-phase rally model that mirrors real match play:
 *
 *   build      — length/drive exchanges, player works to create opportunity
 *   transition — volley intercepts + variation shots break the length rally
 *   pressure   — drops, boasts, attacking shots put opponent under pressure
 *   finish     — kill shots end the rally; engine resets to build
 *
 * The state machine drives shot selection: builds prevent kill spam,
 * kills require earned positioning, drops are capped at 20% of set calls.
 */
export type RallyState = 'build' | 'transition' | 'pressure' | 'finish';

export interface RallyContext {
  state: RallyState;
  /** Calls elapsed in the current state (resets on transition) */
  stateAge: number;
  /** Last 6 voiceText values, across all positions this set */
  shotHistory: string[];
  /** Drop-type calls this set (straight drop, volley drop, counter drop, etc.) */
  dropCallsThisSet: number;
  /** Lob-type calls this set */
  lobCallsThisSet: number;
  /** Kill calls this set */
  killCallsThisSet: number;
  /** Total non-movement calls this set (denominator for % caps) */
  totalCallsThisSet: number;
  /** Calls elapsed since last drop — enforces minimum drop spacing */
  callsSinceLastDrop: number;
  /** Calls elapsed since last kill — prevents kill back-to-back */
  callsSinceLastKill: number;
  /** Calls elapsed since last lob */
  callsSinceLastLob: number;
}

// ─── Shot classification ──────────────────────────────────────────────────────
// Keyed on voiceText (exact values from positionShotMatrix).

const DROP_SHOTS = new Set([
  'straight drop', 'crosscourt drop', 'counter drop',
  'volley drop', 'back-court drop', 'back-court crosscourt drop',
  'trickle boast', 'hold and drop', 'dying length',
]);

const KILL_SHOTS = new Set([
  'straight kill', 'crosscourt kill', 'volley kill',
]);

const LOB_SHOTS = new Set([
  'straight lob', 'crosscourt lob', 'defensive lob', 'volley lob',
]);

// Build shots can repeat more freely — they are the foundation of every rally.
const BUILD_SHOTS = new Set([
  'straight drive', 'working length', 'hard length', 'crosscourt drive',
]);

const VOLLEY_SHOTS = new Set([
  'volley drive', 'volley crosscourt', 'volley drop', 'volley kill', 'volley lob',
]);

const ATTACKING_SHOTS = new Set([
  'attacking boast', 'hold and flick', 'hold and boast', 'reverse angle',
]);

// ─── Context factory ──────────────────────────────────────────────────────────

export function createRallyContext(): RallyContext {
  return {
    state: 'build',
    stateAge: 0,
    shotHistory: [],
    dropCallsThisSet: 0,
    lobCallsThisSet: 0,
    killCallsThisSet: 0,
    totalCallsThisSet: 0,
    callsSinceLastDrop: 999,
    callsSinceLastKill: 999,
    callsSinceLastLob: 999,
  };
}

/**
 * Reset for a new set while preserving continuity across the set boundary.
 * Carries the last 3 shots so the very first shot of a new set can't
 * immediately repeat the final shot of the previous one.
 * Spacing counters are capped at 5 so kill/drop/lob are available
 * early in the new set but still respect their minimum gaps.
 */
export function resetRallyContextForNewSet(ctx: RallyContext): RallyContext {
  return {
    ...createRallyContext(),
    shotHistory: ctx.shotHistory.slice(-3),
    callsSinceLastDrop: Math.min(ctx.callsSinceLastDrop, 5),
    callsSinceLastKill: Math.min(ctx.callsSinceLastKill, 5),
    callsSinceLastLob:  Math.min(ctx.callsSinceLastLob, 5),
  };
}

// ─── State machine ────────────────────────────────────────────────────────────

/**
 * Advance rally context after a shot has been selected.
 * Pass null for movement-only calls (no shot) — spacing counters still tick
 * but totalCallsThisSet does not increment (no shot = no cap impact).
 *
 * Transitions:
 *   build      → transition  after 3–6 calls, or immediately on a volley
 *   transition → pressure    after 2–5 calls, or immediately on a drop/kill
 *   transition → build       if it drags past 5 calls without escalation
 *   pressure   → finish      on kill, or probabilistically after 2 calls
 *   pressure   → build       after 3+ calls to prevent drop spam
 *   finish     → build       always (rally resets)
 */
export function advanceRallyContext(
  ctx: RallyContext,
  shotPlayed: string | null,
): RallyContext {
  const shot     = shotPlayed ?? '';
  const isDrop   = DROP_SHOTS.has(shot);
  const isKill   = KILL_SHOTS.has(shot);
  const isLob    = LOB_SHOTS.has(shot);
  const isVolley = VOLLEY_SHOTS.has(shot);
  const isAttack = ATTACKING_SHOTS.has(shot);

  const newCtx: RallyContext = {
    state:             ctx.state,
    stateAge:          ctx.stateAge + 1,
    shotHistory:       [...ctx.shotHistory, shot].slice(-6),
    dropCallsThisSet:  ctx.dropCallsThisSet  + (isDrop ? 1 : 0),
    lobCallsThisSet:   ctx.lobCallsThisSet   + (isLob  ? 1 : 0),
    killCallsThisSet:  ctx.killCallsThisSet  + (isKill ? 1 : 0),
    totalCallsThisSet: shotPlayed !== null
      ? ctx.totalCallsThisSet + 1
      : ctx.totalCallsThisSet,
    callsSinceLastDrop: isDrop ? 0 : ctx.callsSinceLastDrop + 1,
    callsSinceLastKill: isKill ? 0 : ctx.callsSinceLastKill + 1,
    callsSinceLastLob:  isLob  ? 0 : ctx.callsSinceLastLob  + 1,
  };

  const age = newCtx.stateAge;

  switch (ctx.state) {
    case 'build':
      if (isVolley) {
        newCtx.state = 'transition'; newCtx.stateAge = 0;
      } else if (age >= 4 && (isAttack || Math.random() < 0.28)) {
        newCtx.state = 'transition'; newCtx.stateAge = 0;
      } else if (age >= 7) {
        newCtx.state = 'transition'; newCtx.stateAge = 0;
      }
      break;

    case 'transition':
      if (isDrop || isKill) {
        newCtx.state = 'pressure'; newCtx.stateAge = 0;
      } else if (age >= 3 && Math.random() < 0.38) {
        newCtx.state = 'pressure'; newCtx.stateAge = 0;
      } else if (age >= 6) {
        newCtx.state = 'build'; newCtx.stateAge = 0;
      }
      break;

    case 'pressure':
      if (isKill) {
        newCtx.state = 'finish'; newCtx.stateAge = 0;
      } else if (age >= 2 && Math.random() < 0.42) {
        newCtx.state = 'finish'; newCtx.stateAge = 0;
      } else if (age >= 4) {
        newCtx.state = 'build'; newCtx.stateAge = 0;
      }
      break;

    case 'finish':
      newCtx.state = 'build'; newCtx.stateAge = 0;
      break;
  }

  return newCtx;
}

// ─── Shot context filter ──────────────────────────────────────────────────────

/**
 * Filter a shot candidate list using the current rally context.
 *
 * Rules enforced (in priority order):
 *
 *  1. Kill gate — kills allowed only in pressure/finish state, min 4 calls
 *     since last kill, and only after at least 3 total calls this set
 *     so the drill doesn't open with a kill shot.
 *
 *  2. Drop cap — drops cannot exceed 20% of set calls; minimum 3-call
 *     spacing between drops (prevents lob→drop→lob→drop micro-patterns).
 *
 *  3. Lob cap — lobs cannot exceed 25% of set calls; minimum 2-call spacing.
 *
 *  4. Anti-immediate-repeat — exact same voiceText as the last call is blocked.
 *
 *  5. Anti-near-repeat — any non-build shot that appeared in the last 2 calls
 *     is blocked (cross-position, so "straight drop at FL then straight drop at FR"
 *     is prevented even though they're different positions).
 *
 * Fallback guarantee: if rules 1–5 eliminate all candidates, the function
 * backs off gracefully:
 *   → first relax rules 2–5, keep only the kill gate
 *   → then relax the kill gate too, keeping only anti-immediate-repeat
 *   → finally return the full input list unchanged (never empty)
 */
export function applyRallyContext(
  shots: ShotEntry[],
  ctx: RallyContext,
): ShotEntry[] {
  if (shots.length === 0) return shots;

  const total    = ctx.totalCallsThisSet;
  const dropPct  = total >= 4 ? ctx.dropCallsThisSet / total : 0;
  const lobPct   = total >= 4 ? ctx.lobCallsThisSet  / total : 0;
  const state    = ctx.state;

  const lastShot   = ctx.shotHistory.length > 0
    ? ctx.shotHistory[ctx.shotHistory.length - 1]
    : '';
  const recent2    = ctx.shotHistory.slice(-2);

  const killGatePassed = (vt: string): boolean => {
    if (!KILL_SHOTS.has(vt)) return true;
    return (state === 'pressure' || state === 'finish')
      && ctx.callsSinceLastKill >= 4
      && ctx.totalCallsThisSet >= 3;
  };

  const fullFilter = (entry: ShotEntry): boolean => {
    const vt = entry.voiceText;
    if (!killGatePassed(vt))                                    return false;
    if (DROP_SHOTS.has(vt) && dropPct > 0.20)                   return false;
    if (DROP_SHOTS.has(vt) && ctx.callsSinceLastDrop < 3)       return false;
    if (LOB_SHOTS.has(vt)  && lobPct  > 0.25)                   return false;
    if (LOB_SHOTS.has(vt)  && ctx.callsSinceLastLob  < 2)       return false;
    if (vt === lastShot)                                         return false;
    if (!BUILD_SHOTS.has(vt) && recent2.includes(vt))           return false;
    return true;
  };

  // Full filter
  const full = shots.filter(fullFilter);
  if (full.length > 0) return full;

  // Fallback 1: relax caps, keep only kill gate + anti-immediate-repeat
  const soft = shots.filter(e => killGatePassed(e.voiceText) && e.voiceText !== lastShot);
  if (soft.length > 0) return soft;

  // Fallback 2: only anti-immediate-repeat
  const minimal = shots.filter(e => e.voiceText !== lastShot);
  if (minimal.length > 0) return minimal;

  return shots;
}

// ─── Exported helpers (for unit testing / diagnostics) ───────────────────────

export { DROP_SHOTS, KILL_SHOTS, LOB_SHOTS, BUILD_SHOTS, VOLLEY_SHOTS };
