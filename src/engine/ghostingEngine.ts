import { SessionConfig, Position, ShotGroup } from '../types';
import {
  FIXED_ORDER_6PT, FIXED_ORDER_10PT,
  COVERAGE_FILTER, HAND_MIRROR,
  POSITION_ZONE,
  getPositionsForSystem,
} from '../constants/positions';
import {
  getIntervalMs, getRecoveryMs, MOVES_PER_SET, estimateTotalMoves,
  POSITION_PHASE_OFFSET_MS, MATCH_SIM_STEP_RATE,
} from '../constants/timing';
import { getShotsForPosition, pickShot } from './positionShotMatrix';

// ─── Public interface ─────────────────────────────────────────────────────────

export interface SessionMove {
  position: Position;
  shot: string | null;
  intervalMs: number;
  recoveryMs: number;
  setIndex: number;
  moveIndex: number;
  phaseOffsetMs: number;       // extra time at position for front corners (FR/FL +250ms, FMCR/FMCL +100ms)
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
  /** Advance the engine to the given set index and rebuild the set sequence.
   *  Preserves match-sim progressive speed (setIndex drives the 10% reduction).
   *  Cannot restore the exact position sequence (it is random), but ensures
   *  the engine continues from the correct set count rather than repeating set 0. */
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
//     Fixed            fixedSet() filters FIXED_ORDER to pool positions only.
//
//     Random           shuffleNoRepeat() seeded with pool; every pick is in-zone.
//
//     Shot-Based       buildShotBasedPool() intersects SHOT_GROUP_POSITIONS with pool.
//                      Fallback when intersection < 2 returns pool (NOT base) —
//                      zone scope preserved even when no shot-group match exists.
//
//     Match-Sim        matchSimSet() filters templates to pool-compatible ones.
//                      Falls back to shuffleNoRepeat(pool) on no match.
//
// ─── Shot-group → preferred court positions ───────────────────────────────────
// Derived from positionShotMatrix: only positions with primary or secondary shots
// for each group are listed. Advanced-only positions excluded intentionally —
// drills visit tactically representative zones, not exotic outliers.
//
// Key decisions:
//  drives:  T + FMCR/FMCL included — Volley Drive is PRIMARY at all three.
//           Drives drills must train volley interception, not just deep-court.
//  drops:   BR/BL excluded — Back-Court Drop is an advanced outlier. Drop drills
//           train the front/mid short game; back corners don't belong here.
//  boasts:  FR/FL excluded — Trickle Boast (the only front-corner boast) is
//           advanced/niche. Boast drills train back and mid-court boast decisions.
//  'mixed': omitted — means all pool positions are valid (no restriction).

const SHOT_GROUP_POSITIONS: Partial<Record<ShotGroup, Position[]>> = {
  drives:    ['T', 'FR', 'FL', 'FMCR', 'FMCL', 'MR', 'ML', 'BMCR', 'BMCL', 'BR', 'BL'],
  lengths:   ['BR', 'BL', 'BMCR', 'BMCL', 'MR', 'ML'],
  drops:     ['FR', 'FL', 'FMCR', 'FMCL', 'MR', 'ML'],
  kills:     ['FR', 'FL', 'FMCR', 'FMCL', 'T'],
  lobs:      ['BR', 'BL', 'BMCR', 'BMCL', 'MR', 'ML', 'FR', 'FL', 'FMCR', 'FMCL'],
  boasts:    ['BR', 'BL', 'BMCR', 'BMCL', 'MR', 'ML'],
  volleys:   ['T', 'FMCR', 'FMCL', 'MR', 'ML'],
  deception: ['T', 'FMCR', 'FMCL', 'MR', 'ML', 'BR', 'BL'],
};

// ─── Match simulation rally templates ─────────────────────────────────────────
// Each template is a predefined rally sequence of (position + contextual shot).
// Shots are specific to the rally context — not drawn from the generic matrix.
// Right-handed layout; mirrored for left-handed players at voice-call time.

interface MatchSimEntry {
  position: Position;
  shot: string | null;
}

const MATCH_SIM_PATTERNS_6PT: MatchSimEntry[][] = [
  // Classic Drive-Drop: drive length from deep, attack with drop at front
  [
    { position: 'BR', shot: 'straight drive'     },
    { position: 'FR', shot: 'straight drop'      },
    { position: 'BL', shot: 'straight drive'     },
    { position: 'FL', shot: 'straight drop'      },
  ],
  // Boast-Drive: defensive boast from back, straight drive return from front
  [
    { position: 'BL', shot: 'defensive boast'    },
    { position: 'FR', shot: 'straight drive'     },
    { position: 'BR', shot: 'defensive boast'    },
    { position: 'FL', shot: 'straight drive'     },
  ],
  // Length-Drop-Volley rally: drive deep, attack with drop, intercept at T
  [
    { position: 'BR', shot: 'straight drive'     },
    { position: 'FR', shot: 'straight drop'      },
    { position: 'T',  shot: 'volley drive'       },
    { position: 'BL', shot: 'straight drive'     },
    { position: 'FL', shot: 'straight drop'      },
    { position: 'T',  shot: 'volley drop'        },
  ],
  // Figure-of-eight pressure: diagonal runs that mirror real rally geometry
  [
    { position: 'BR', shot: 'crosscourt drive'   },
    { position: 'FL', shot: 'straight drop'      },
    { position: 'MR', shot: 'straight drive'     },
    { position: 'BL', shot: 'crosscourt drive'   },
    { position: 'FR', shot: 'straight drop'      },
    { position: 'ML', shot: 'straight drive'     },
  ],
  // Drive-Boast-Drop: drive long, recover to T, boast from back, attack with drop
  [
    { position: 'BR', shot: 'straight drive'     },
    { position: 'T',  shot: null                 },
    { position: 'BL', shot: 'defensive boast'    },
    { position: 'FR', shot: 'straight drop'      },
  ],
  // T Volley Intercept: attack from the T, opponent pushed deep
  [
    { position: 'T',  shot: 'volley drive'       },
    { position: 'BR', shot: 'hard length'        },
    { position: 'T',  shot: 'volley drop'        },
    { position: 'FL', shot: 'straight drive'     },
  ],
  // Crosscourt Pressure: alternating diagonal lob-drop rally
  [
    { position: 'BR', shot: 'crosscourt lob'     },
    { position: 'FL', shot: 'straight drop'      },
    { position: 'BL', shot: 'crosscourt lob'     },
    { position: 'FR', shot: 'straight drop'      },
  ],
  // Mid-court Width Game: crosscourt drives from service-line box
  [
    { position: 'MR', shot: 'crosscourt drive'   },
    { position: 'BL', shot: 'hard length'        },
    { position: 'ML', shot: 'crosscourt drive'   },
    { position: 'BR', shot: 'hard length'        },
  ],
  // Hold-and-Attack: deception at T, opponent punished front and back
  [
    { position: 'T',  shot: 'volley crosscourt'  },
    { position: 'FR', shot: 'straight drive'     },
    { position: 'BL', shot: 'defensive boast'    },
    { position: 'T',  shot: 'volley drop'        },
    { position: 'FL', shot: 'crosscourt drive'   },
    { position: 'BR', shot: 'hard length'        },
  ],
  // Length-and-Boast-Rotation: classic 3-touch drill pattern
  [
    { position: 'BR', shot: 'straight drive'     },
    { position: 'BL', shot: 'defensive boast'    },
    { position: 'FR', shot: 'crosscourt drive'   },
  ],
];

const MATCH_SIM_PATTERNS_10PT: MatchSimEntry[][] = [
  ...MATCH_SIM_PATTERNS_6PT,
  // Front Volley Pressure (10pt): intercept at front volley zone
  [
    { position: 'BMCR', shot: 'straight drive'   },
    { position: 'FMCL', shot: 'volley drop'      },
    { position: 'BMCL', shot: 'straight drive'   },
    { position: 'FMCR', shot: 'volley drop'      },
  ],
  // Volley-Drive Attack (10pt): intercept early and drive opponent deep
  [
    { position: 'FMCR', shot: 'volley drive'     },
    { position: 'BL',   shot: 'straight drive'   },
    { position: 'FMCL', shot: 'volley drive'     },
    { position: 'BR',   shot: 'straight drive'   },
  ],
];

// ─── Private helpers ──────────────────────────────────────────────────────────

// Crosscourt-diagonal pairs — the most common transition in match squash.
// Used to weight shuffleNoRepeat toward match-realistic movement patterns.
const CROSSCOURT_DIAGONAL: Partial<Record<Position, Position>> = {
  BR: 'FL',   FL: 'BR',
  BL: 'FR',   FR: 'BL',
  BMCR: 'FMCL', FMCL: 'BMCR',
  BMCL: 'FMCR', FMCR: 'BMCL',
  MR: 'ML',   ML: 'MR',
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
 * Zone-aware shuffle with anti-streak logic.
 * Rules:
 *  1. No position repeats back-to-back.
 *  2. No position repeats two slots ago (avoids A-B-A ping-pong).
 *  3. After THREE consecutive positions in the same zone, force a zone change.
 *     (Front/back zones are physically demanding — 3+ same-zone runs are brutal at fast pace.)
 *  4. Re-shuffles the pool at every full cycle so identical patterns never repeat.
 */
function shuffleNoRepeat(pool: Position[], count: number): Position[] {
  if (pool.length === 0) return [];
  if (pool.length === 1) return Array(count).fill(pool[0]);

  const result: Position[] = [];
  let p = shuffle([...pool]);
  let prev1: Position | null = null;
  let prev2: Position | null = null;
  let prev3: Position | null = null;

  for (let i = 0; i < count; i++) {
    if (i > 0 && i % pool.length === 0) p = shuffle([...pool]);

    let candidates = p.filter(pos => pos !== prev1 && pos !== prev2);
    if (candidates.length === 0) candidates = p.filter(pos => pos !== prev1);
    if (candidates.length === 0) candidates = [...p];

    // Force zone change after 3 consecutive same-zone positions
    const sameZoneStreak =
      prev1 && prev2 && prev3 &&
      POSITION_ZONE[prev1] === POSITION_ZONE[prev2] &&
      POSITION_ZONE[prev2] === POSITION_ZONE[prev3];

    if (sameZoneStreak) {
      const diffZone = candidates.filter(pos => POSITION_ZONE[pos] !== POSITION_ZONE[prev1!]);
      if (diffZone.length > 0) candidates = diffZone;
    } else if (prev1 && prev2 && POSITION_ZONE[prev1] === POSITION_ZONE[prev2]) {
      // After 2 same-zone, prefer different but don't force
      const diffZone = candidates.filter(pos => POSITION_ZONE[pos] !== POSITION_ZONE[prev1!]);
      if (diffZone.length > 0) candidates = diffZone;
    }

    // Weight the crosscourt diagonal 2× — ~70% pull toward match-realistic transitions
    // when the diagonal candidate is available, without forcing it every time.
    const diagonal: Position | undefined = prev1 ? CROSSCOURT_DIAGONAL[prev1] : undefined;
    const weighted: Position[] = diagonal
      ? candidates.flatMap((pos) => pos === diagonal ? [pos, pos] : [pos])
      : candidates;
    const next: Position = weighted[Math.floor(Math.random() * weighted.length)];
    result.push(next);
    prev3 = prev2;
    prev2 = prev1;
    prev1 = next;
  }
  return result;
}

function buildPool(config: SessionConfig): Position[] {
  const base   = getPositionsForSystem(config.courtSystem);
  const filter = (COVERAGE_FILTER[config.coverage] ?? base) as Position[];

  // Step 1: intersect base positions with the coverage zone filter
  let pool = base.filter((p) => filter.includes(p));

  // Step 2: T is the recovery base, not a movement target — exclude from movement-only drills.
  // It remains available for shot-based and match-sim where T volleys are tactically valid.
  if (config.drillType === 'movement') {
    pool = pool.filter((p) => p !== 'T');
  }

  // Step 3: mirror L↔R for left-handed players (done after zone filter so COVERAGE_FILTER
  // uses right-handed codes as the canonical definition, then mirroring translates to physical)
  if (config.dominantHand === 'left') {
    pool = pool.map((p) => HAND_MIRROR[p]);
  }

  // Fallback: if filtering reduced pool below 2 positions (edge case — e.g. 6pt with a
  // zone that only touches 1 position), widen within the zone before giving up on scope.
  // Never fall back to coverage-unaware base positions.
  if (pool.length < 2) {
    const zoneWithT = base.filter((p) => filter.includes(p));
    if (zoneWithT.length >= 2) return zoneWithT;
    // Absolute last resort: use any 2 non-T positions from the court system
    return base.filter((p) => p !== 'T').slice(0, 2);
  }

  return pool;
}

// Narrows the zone pool to positions where the selected shot groups have
// primary or secondary shots. Ensures shot-based drills only visit tactically
// realistic positions for the chosen shots.
//
// Fallback contract: when the shot-group intersection yields < 2 positions,
// returns basePool — NOT the raw court-system base — so zone scope is ALWAYS
// preserved. The engine may call fewer of the selected shot types at some
// positions, but it will never send the player outside their chosen zone.
function buildShotBasedPool(basePool: Position[], shotGroups: ShotGroup[]): Position[] {
  if (shotGroups.includes('mixed')) return basePool;
  const preferred = new Set<Position>();
  for (const group of shotGroups) {
    (SHOT_GROUP_POSITIONS[group] ?? []).forEach(p => preferred.add(p as Position));
  }
  const filtered = basePool.filter(p => preferred.has(p));
  return filtered.length >= 2 ? filtered : basePool;
}

function fixedSet(config: SessionConfig, pool: Position[], count: number): Position[] {
  const order = config.courtSystem === '6pt' ? FIXED_ORDER_6PT : FIXED_ORDER_10PT;
  const filtered = order.filter((p) => pool.includes(p));
  if (filtered.length === 0) return shuffleNoRepeat(pool, count);
  return Array.from({ length: count }, (_, i) => filtered[i % filtered.length]);
}

function matchSimSet(
  config: SessionConfig,
  pool: Position[],
  count: number,
): { positions: Position[]; shots: (string | null)[] } {
  const templates =
    config.courtSystem === '10pt' ? MATCH_SIM_PATTERNS_10PT : MATCH_SIM_PATTERNS_6PT;

  // Only use templates whose positions are all in the active pool
  const compatible = templates.filter(t => t.every(e => pool.includes(e.position)));

  if (compatible.length === 0) {
    // No compatible template — fall back to random positions, no template shots
    const positions = shuffleNoRepeat(pool, count);
    return { positions, shots: new Array(count).fill(null) };
  }

  const pattern = compatible[Math.floor(Math.random() * compatible.length)];
  const positions = Array.from({ length: count }, (_, i) => pattern[i % pattern.length].position);
  const shots     = Array.from({ length: count }, (_, i) => pattern[i % pattern.length].shot);
  return { positions, shots };
}

// Shot names are position-agnostic (no forehand/backhand prefix), so no
// mirroring is needed for left-handed players — the position label already
// communicates which hand is used.

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createGhostingEngine(config: SessionConfig): GhostingEngine {
  const baseIntervalMs = getIntervalMs(config.difficulty, config.tempo);
  const movesPerSet    = MOVES_PER_SET[config.difficulty];
  const pool           = buildPool(config);

  let setIndex      = 0;
  let moveIndex     = 0;
  let sequence:     Position[]          = [];
  let sequenceShots: (string | null)[]  = [];

  function effectiveInterval(): number {
    if (config.patternType !== 'match-sim') return baseIntervalMs;
    // Progressive speed increase per 3 sets — rate scales with difficulty so beginners
    // train at stable pace while advanced/elite/pro face increasing pressure.
    const stepRate  = MATCH_SIM_STEP_RATE[config.difficulty] ?? 0.10;
    const reduction = Math.floor(setIndex / 3) * stepRate;
    return Math.max(baseIntervalMs * 0.60, baseIntervalMs * (1 - reduction));
  }

  function buildSet(): void {
    const nullShots = (positions: Position[]) => ({
      positions,
      shots: new Array(positions.length).fill(null) as (string | null)[],
    });

    let result: { positions: Position[]; shots: (string | null)[] };

    switch (config.patternType) {
      case 'fixed':
        result = nullShots(fixedSet(config, pool, movesPerSet));
        break;
      case 'shot-based':
        // Filter positions to where the selected shot groups are tactically meaningful
        result = nullShots(shuffleNoRepeat(buildShotBasedPool(pool, config.shotGroups), movesPerSet));
        break;
      case 'match-sim':
        // Use predefined rally templates with contextual shots
        result = matchSimSet(config, pool, movesPerSet);
        break;
      case 'random':
      default:
        // BUG-008: if drillType is shot-based, apply position filtering even for random pattern
        // so positions are always tactically relevant for the selected shot groups.
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

  // Initialise first set
  buildSet();

  return {
    getNextMove(): SessionMove {
      // Roll over to new set if current one is exhausted
      if (moveIndex >= sequence.length) {
        setIndex++;
        moveIndex = 0;
        buildSet();
      }

      const position    = sequence[moveIndex];
      const interval    = effectiveInterval();
      const templateShot = sequenceShots[moveIndex] ?? null;

      // Shot selection:
      // - movement drills: never call shots
      // - match-sim: use the template's contextual shot (mirrored for left-handed)
      // - shot-based / random / fixed with shot drillType: pick from position-shot matrix
      let shot: string | null = null;
      if (config.drillType !== 'movement') {
        if (templateShot !== null) {
          shot = templateShot;
        } else {
          // For left-handed players the pool was mirrored; unmirror before shot lookup
          // so the shot matrix (keyed on right-handed layout) returns the correct hand.
          const shotLookupPos = config.dominantHand === 'left' ? HAND_MIRROR[position] : position;
          const shots = getShotsForPosition(shotLookupPos, config.shotGroups, config.difficulty);
          const entry = pickShot(shots, config.difficulty);
          shot = entry?.voiceText ?? null;
        }
      }

      const move: SessionMove = {
        position,
        shot,
        intervalMs:    interval,
        recoveryMs:    getRecoveryMs(interval),
        setIndex,
        moveIndex,
        phaseOffsetMs: POSITION_PHASE_OFFSET_MS[position] ?? 0,
      };

      moveIndex++;
      return move;
    },

    peekNextPosition(): Position | null {
      if (moveIndex < sequence.length) return sequence[moveIndex];
      // Next set not yet generated — don't corrupt RNG by building a dummy set.
      // The "Coming Up" hint will be absent at set boundaries, which is honest.
      return null;
    },

    isSetComplete():        boolean { return moveIndex >= sequence.length; },
    getSetIndex():          number  { return setIndex; },
    getMoveIndex():         number  { return moveIndex; },
    estimatedTotalMoves(): number  { return estimateTotalMoves(config.duration, config.difficulty, config.tempo); },

    reset(): void {
      setIndex  = 0;
      moveIndex = 0;
      buildSet();
    },

    seekToSet(targetSetIndex: number): void {
      setIndex  = Math.max(0, targetSetIndex);
      moveIndex = 0;
      buildSet();
    },
  };
}
