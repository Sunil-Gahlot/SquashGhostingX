import { SessionConfig, Position, ShotGroup } from '../types';
import {
  FIXED_ORDER_6PT, FIXED_ORDER_10PT,
  COVERAGE_FILTER, HAND_MIRROR,
  POSITION_ZONE, POSITIONS_10PT,
  getPositionsForSystem,
} from '../constants/positions';
import {
  getDynamicIntervalMs, getDynamicMovementPhaseMs,
  getRecoveryMs, MOVES_PER_SET, estimateTotalMoves,
  POSITION_PHASE_OFFSET_MS, MATCH_SIM_STEP_RATE,
} from '../constants/timing';
import { getShotsForPosition, pickShotWithCooldown } from './positionShotMatrix';
import { pickNextPattern } from './patternLibrary';
import { pickNextTemplate, RallyStep } from './rallyTemplates';

// ─── Public interface ─────────────────────────────────────────────────────────

export interface SessionMove {
  position: Position;
  shot: string | null;
  nextShot: string | null;       // populated for match-sim voice lookahead; null otherwise
  intervalMs: number;
  recoveryMs: number;
  movementPhaseMs: number;       // ms from call until recovery cue should fire
  setIndex: number;
  moveIndex: number;
  phaseOffsetMs: number;         // legacy front-corner extra time (still used by older callers)
}

export interface GhostingEngine {
  /** Advance and return the next move. Rolls over to a new set automatically. */
  getNextMove(): SessionMove;
  /** Look at the next position without advancing the pointer. */
  peekNextPosition(): Position | null;
  /** Look at next position + shot for match-sim voice lookahead. */
  peekNextMove(): { position: Position; shot: string | null } | null;
  /** True when all moves in the current set have been returned. */
  isSetComplete(): boolean;
  getSetIndex(): number;
  getMoveIndex(): number;
  /** Estimated total moves for the full session duration. */
  estimatedTotalMoves(): number;
  /** Reset to the start of set 0 (used for resume / re-run). */
  reset(): void;
  /** Advance the engine to the given set index and rebuild the set sequence. */
  seekToSet(targetSetIndex: number): void;
}

// ─── Zone constraint chain ────────────────────────────────────────────────────
//
// Coverage is the primary zone constraint. It flows through every sequence type:
//
//  1. buildPool()      intersects court-system positions with COVERAGE_FILTER,
//                      removes T for movement drills, mirrors for left-handed.
//                      Result: POOL — the authoritative zone scope.
//
//  2. All sequence types receive POOL and cannot generate out-of-zone positions:
//
//     Fixed            fixedSet() uses pattern library filtered to pool positions.
//
//     Random           shuffleNoRepeat() seeded with pool; every pick is in-zone.
//
//     Shot-Based       buildShotBasedPool() intersects SHOT_GROUP_POSITIONS with pool.
//                      Fallback when intersection < 2 returns pool (NOT base) —
//                      zone scope preserved even when no shot-group match exists.
//
//     Match-Sim        matchSimSet() filters templates to pool-compatible ones.
//                      Falls back to shuffleNoRepeat(pool) on no match.

const SHOT_GROUP_POSITIONS: Partial<Record<ShotGroup, Position[]>> = {
  drives:    ['T', 'FR', 'FL', 'FMCR', 'FMCL', 'MR', 'ML', 'BMCR', 'BMCL', 'BR', 'BL'],
  lengths:   ['BR', 'BL', 'BMCR', 'BMCL', 'MR', 'ML'],
  drops:     ['FR', 'FL', 'FMCR', 'FMCL'],
  kills:     ['FR', 'FL', 'FMCR', 'FMCL', 'MR', 'ML', 'T'],
  lobs:      ['BR', 'BL', 'BMCR', 'BMCL', 'MR', 'ML', 'FR', 'FL', 'FMCR', 'FMCL'],
  boasts:    ['BR', 'BL', 'BMCR', 'BMCL', 'MR', 'ML'],
  volleys:   ['T', 'FMCR', 'FMCL', 'MR', 'ML'],
  deception: ['T', 'FMCR', 'FMCL', 'MR', 'ML', 'BR', 'BL'],
};

// ─── Private helpers ──────────────────────────────────────────────────────────

const CROSSCOURT_DIAGONAL: Partial<Record<Position, Position>> = {
  BR: 'FL',   FL: 'BR',
  BL: 'FR',   FR: 'BL',
  BMCR: 'FMCL', FMCL: 'BMCR',
  BMCL: 'FMCR', FMCR: 'BMCL',
  MR: 'ML',   ML: 'MR',
};

const SAME_SIDE_PARTNER: Partial<Record<Position, Position>> = {
  FR: 'BR',   BR: 'FR',
  FL: 'BL',   BL: 'FL',
  FMCR: 'BMCR', BMCR: 'FMCR',
  FMCL: 'BMCL', BMCL: 'FMCL',
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Zone-aware shuffle with zone-balanced anti-streak logic.
 *
 * 1. No back-to-back same position (prev1 exclusion only).
 * 2. After two consecutive same-zone positions, prefer a different zone.
 *    After three, force it.
 * 3. Cross-court diagonal weighted 2× for match-realistic transitions.
 *    Falls back to same-side sprint partner when diagonal is outside the pool.
 * 4. Pool reshuffled at every full cycle for additional pattern variety.
 */
function shuffleNoRepeat(pool: Position[], count: number): Position[] {
  if (pool.length === 0) return [];
  if (pool.length === 1) return Array(count).fill(pool[0]);

  const result: Position[] = [];
  let p     = shuffle([...pool]);
  let prev1: Position | null = null;
  let prev2: Position | null = null;
  let prev3: Position | null = null;

  for (let i = 0; i < count; i++) {
    if (i > 0 && i % pool.length === 0) p = shuffle([...pool]);

    let candidates = p.filter(pos => pos !== prev1);
    if (candidates.length === 0) candidates = [...p];

    const streak2 = prev1 !== null && prev2 !== null &&
      POSITION_ZONE[prev1] === POSITION_ZONE[prev2];
    const streak3 = streak2 && prev3 !== null &&
      POSITION_ZONE[prev2!] === POSITION_ZONE[prev3];

    let next: Position;

    if ((streak3 || streak2) && prev1 !== null) {
      const diffZone = candidates.filter(pos => POSITION_ZONE[pos] !== POSITION_ZONE[prev1!]);
      const src = diffZone.length > 0 ? diffZone : candidates;
      const zones = [...new Set(src.map(pos => POSITION_ZONE[pos]))];
      const zone  = zones[Math.floor(Math.random() * zones.length)];
      const inZone = src.filter(pos => POSITION_ZONE[pos] === zone);
      next = inZone[Math.floor(Math.random() * inZone.length)];
    } else {
      const diagonal = prev1 ? CROSSCOURT_DIAGONAL[prev1] : undefined;
      const partner  = prev1 ? SAME_SIDE_PARTNER[prev1] : undefined;
      const weighted: Position[] =
        diagonal && candidates.some(c => c === diagonal)
          ? candidates.flatMap(pos => pos === diagonal ? [pos, pos] : [pos])
          : partner && candidates.some(c => c === partner)
          ? candidates.flatMap(pos => pos === partner ? [pos, pos] : [pos])
          : candidates;
      next = weighted[Math.floor(Math.random() * weighted.length)];
    }

    result.push(next);
    prev3 = prev2;
    prev2 = prev1;
    prev1 = next;
  }
  return result;
}

function buildPool(config: SessionConfig): Position[] {
  const base   = config.coverage === 'full'
    ? getPositionsForSystem(config.courtSystem)
    : POSITIONS_10PT;
  const filter = (COVERAGE_FILTER[config.coverage] ?? base) as Position[];

  let pool = base.filter((p) => filter.includes(p));

  if (config.drillType === 'movement') {
    pool = pool.filter((p) => p !== 'T');
  }

  if (config.dominantHand === 'left') {
    pool = pool.map((p) => HAND_MIRROR[p]);
  }

  if (pool.length < 2) {
    const zoneWithT = base.filter((p) => filter.includes(p));
    if (zoneWithT.length >= 2) return zoneWithT;
    const zoneAny = filter.length >= 2 ? filter.slice(0, 2) as Position[] : base.filter((p) => p !== 'T').slice(0, 2);
    return zoneAny;
  }

  return pool;
}

function buildShotBasedPool(basePool: Position[], shotGroups: ShotGroup[]): Position[] {
  if (shotGroups.includes('mixed')) return basePool;
  const preferred = new Set<Position>();
  for (const group of shotGroups) {
    (SHOT_GROUP_POSITIONS[group] ?? []).forEach(p => preferred.add(p as Position));
  }
  const filtered = basePool.filter(p => preferred.has(p));
  return filtered.length >= 2 ? filtered : basePool;
}

function fixedSet(
  config: SessionConfig,
  pool: Position[],
  count: number,
  recentPatternNames: string[],
): Position[] {
  const is10pt = config.courtSystem === '10pt' || config.coverage !== 'full';

  // Try to pick a named pattern from the library (anti-repeat across sets)
  const pattern = pickNextPattern(is10pt, recentPatternNames);
  const filtered = pattern.positions.filter((p) => pool.includes(p));

  if (filtered.length >= 2) {
    recentPatternNames.push(pattern.name);
    if (recentPatternNames.length > 30) recentPatternNames.shift();
    return Array.from({ length: count }, (_, i) => filtered[i % filtered.length]);
  }

  // Fallback to legacy fixed order when pattern positions don't overlap pool
  const order = is10pt ? FIXED_ORDER_10PT : FIXED_ORDER_6PT;
  const fallback = order.filter((p) => pool.includes(p));
  if (fallback.length > 0) {
    return Array.from({ length: count }, (_, i) => fallback[i % fallback.length]);
  }

  return shuffleNoRepeat(pool, count);
}

function matchSimSet(
  config: SessionConfig,
  pool: Position[],
  count: number,
  recentTemplateNames: string[],
): { positions: Position[]; shots: (string | null)[] } {
  const is10pt = config.courtSystem === '10pt';

  // Pick from the expanded rally template library with anti-repeat
  const template = pickNextTemplate(config.difficulty, is10pt, recentTemplateNames);
  const compatible = template.steps.every((s: RallyStep) => pool.includes(s.position));

  if (compatible) {
    recentTemplateNames.push(template.name);
    if (recentTemplateNames.length > 50) recentTemplateNames.shift();

    const positions = Array.from({ length: count }, (_, i) => template.steps[i % template.steps.length].position);
    const shots     = Array.from({ length: count }, (_, i) => template.steps[i % template.steps.length].shot);
    return { positions, shots };
  }

  // No compatible template — fall back to random positions without template shots
  return {
    positions: shuffleNoRepeat(pool, count),
    shots:     new Array(count).fill(null) as (string | null)[],
  };
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createGhostingEngine(config: SessionConfig): GhostingEngine {
  const movesPerSet = MOVES_PER_SET[config.difficulty];
  const pool        = buildPool(config);

  let setIndex      = 0;
  let moveIndex     = 0;
  let sequence:      Position[]         = [];
  let sequenceShots: (string | null)[]  = [];

  // Anti-repeat history — persists across sets for the full session
  const recentPatternNames:  string[] = [];
  const recentTemplateNames: string[] = [];
  // Per-position shot cooldown: tracks the last 8 shot voiceTexts independently for
  // each position so that e.g. "straight drop" at FR doesn't suppress it at FL —
  // they are different physical actions (forehand vs backhand) and should vary independently.
  const recentShotsPerPos: Partial<Record<string, string[]>> = {};

  function effectiveIntervalMs(position: Position): number {
    const base = getDynamicIntervalMs(position, config.difficulty, config.tempo, config.paceAdjustment);
    if (config.patternType !== 'match-sim') return base;
    // Progressive speed increase per 3 sets for match-sim.
    // Floor is 75% of the explosive-tempo baseline for this position — this ensures
    // back-corner positions (BL/BR at ~4.8m from T) never drop below what is
    // physically achievable even for pro-level players on the fastest setting.
    const stepRate      = MATCH_SIM_STEP_RATE[config.difficulty] ?? 0.10;
    const reduction     = Math.floor(setIndex / 3) * stepRate;
    const explosiveBase = getDynamicIntervalMs(position, config.difficulty, 'explosive');
    const floor         = Math.round(explosiveBase * 0.75);
    return Math.max(floor, Math.round(base * (1 - reduction)));
  }

  function buildSet(): void {
    const nullShots = (positions: Position[]) => ({
      positions,
      shots: new Array(positions.length).fill(null) as (string | null)[],
    });

    let result: { positions: Position[]; shots: (string | null)[] };

    switch (config.patternType) {
      case 'fixed':
        result = nullShots(fixedSet(config, pool, movesPerSet, recentPatternNames));
        break;
      case 'shot-based':
        result = nullShots(shuffleNoRepeat(buildShotBasedPool(pool, config.shotGroups), movesPerSet));
        break;
      case 'match-sim':
        result = matchSimSet(config, pool, movesPerSet, recentTemplateNames);
        break;
      case 'random':
      default:
        if (config.drillType === 'shot-based') {
          result = nullShots(shuffleNoRepeat(buildShotBasedPool(pool, config.shotGroups), movesPerSet));
        } else {
          result = nullShots(shuffleNoRepeat(pool, movesPerSet));
        }
        break;
    }

    sequence      = result.positions;
    sequenceShots = result.shots;
  }

  buildSet();

  return {
    getNextMove(): SessionMove {
      if (moveIndex >= sequence.length) {
        setIndex++;
        moveIndex = 0;
        buildSet();
      }

      const position     = sequence[moveIndex];
      const templateShot = sequenceShots[moveIndex] ?? null;
      const intervalMs   = effectiveIntervalMs(position);

      // Shot selection:
      //   movement drills  → no shots
      //   match-sim        → use template shot
      //   shot-based/other → pick from position-shot matrix with per-position cooldown
      let shot: string | null = null;
      if (config.drillType !== 'movement') {
        if (templateShot !== null) {
          shot = templateShot;
        } else {
          const shotLookupPos = config.dominantHand === 'left' ? HAND_MIRROR[position] : position;
          const shots  = getShotsForPosition(shotLookupPos, config.shotGroups, config.difficulty);
          const posKey = shotLookupPos as string;
          if (!recentShotsPerPos[posKey]) recentShotsPerPos[posKey] = [];
          const posHistory = recentShotsPerPos[posKey]!;
          const entry  = pickShotWithCooldown(shots, config.difficulty, posHistory);
          shot = entry?.voiceText ?? null;
          if (shot !== null) {
            posHistory.push(shot);
            if (posHistory.length > 8) posHistory.shift();
          }
        }
      }

      // Peek the next shot for match-sim voice lookahead
      let nextShot: string | null = null;
      if (config.drillType === 'match-sim' || config.patternType === 'match-sim') {
        const nextIdx = moveIndex + 1;
        if (nextIdx < sequenceShots.length) {
          nextShot = sequenceShots[nextIdx] ?? null;
        }
      }

      const movementPhaseMs = getDynamicMovementPhaseMs(
        position,
        config.difficulty,
        config.tempo,
        config.paceAdjustment,
      );

      const move: SessionMove = {
        position,
        shot,
        nextShot,
        intervalMs,
        recoveryMs:     getRecoveryMs(intervalMs),
        movementPhaseMs,
        setIndex,
        moveIndex,
        phaseOffsetMs:  POSITION_PHASE_OFFSET_MS[position] ?? 0,
      };

      moveIndex++;
      return move;
    },

    peekNextPosition(): Position | null {
      if (moveIndex < sequence.length) return sequence[moveIndex];
      return null;
    },

    peekNextMove(): { position: Position; shot: string | null } | null {
      if (moveIndex < sequence.length) {
        return {
          position: sequence[moveIndex],
          shot:     sequenceShots[moveIndex] ?? null,
        };
      }
      return null;
    },

    isSetComplete():        boolean { return moveIndex >= sequence.length; },
    getSetIndex():          number  { return setIndex; },
    getMoveIndex():         number  { return moveIndex; },
    estimatedTotalMoves(): number  {
      return estimateTotalMoves(config.duration, config.difficulty, config.tempo, config.paceAdjustment);
    },

    reset(): void {
      setIndex  = 0;
      moveIndex = 0;
      Object.keys(recentShotsPerPos).forEach(k => { delete recentShotsPerPos[k]; });
      recentPatternNames.length  = 0;
      recentTemplateNames.length = 0;
      buildSet();
    },

    seekToSet(targetSetIndex: number): void {
      setIndex  = Math.max(0, targetSetIndex);
      moveIndex = 0;
      buildSet();
    },
  };
}
