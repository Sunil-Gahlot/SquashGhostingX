import { SessionConfig, Position, ShotGroup } from '../types';
import {
  FIXED_ORDER_6PT, FIXED_ORDER_10PT,
  COVERAGE_FILTER, HAND_MIRROR,
  POSITION_ZONE,
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
  /** Advance the engine to the given set index and rebuild the set sequence.
   *  Preserves match-sim progressive speed (setIndex drives the 10% reduction).
   *  Cannot restore the exact position sequence (it is random), but ensures
   *  the engine continues from the correct set count rather than repeating set 0. */
  seekToSet(targetSetIndex: number): void;
}

// ─── Shot-group → preferred court positions ───────────────────────────────────
// Each group maps to positions where those shots have primary or secondary weight.
// Used to constrain shot-based drills so positions are always tactically realistic.

const SHOT_GROUP_POSITIONS: Partial<Record<ShotGroup, Position[]>> = {
  drives:     ['BR', 'BL', 'BMCR', 'BMCL', 'MR', 'ML', 'FR', 'FL'],
  lengths:    ['BR', 'BL', 'BMCR', 'BMCL', 'MR', 'ML'],
  drops:      ['FR', 'FL', 'FMCR', 'FMCL', 'MR', 'ML', 'BR', 'BL'],
  kills:      ['FR', 'FL', 'FMCR', 'FMCL', 'T'],
  lobs:       ['BR', 'BL', 'BMCR', 'BMCL', 'MR', 'ML', 'FR', 'FL', 'FMCR', 'FMCL'],
  boasts:     ['BR', 'BL', 'BMCR', 'BMCL', 'MR', 'ML', 'FR', 'FL'],
  volleys:    ['T', 'FMCR', 'FMCL', 'MR', 'ML'],
  deception:  ['T', 'FMCR', 'FMCL', 'MR', 'ML', 'BR', 'BL'],
  // 'mixed' omitted — means all positions are valid
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
  // Boast-Drop (3-shot repeat): sustained attacking pattern
  [
    { position: 'BR', shot: 'defensive boast'    },
    { position: 'FL', shot: 'straight drop'      },
    { position: 'BR', shot: 'defensive boast'    },
    { position: 'FL', shot: 'straight drop'      },
    { position: 'BR', shot: 'defensive boast'    },
    { position: 'FL', shot: 'straight drop'      },
  ],
  // Crosscourt Exchange: sustained crosscourt drives
  [
    { position: 'BR', shot: 'crosscourt drive'   },
    { position: 'FL', shot: 'crosscourt drive'   },
    { position: 'BR', shot: 'crosscourt drive'   },
    { position: 'FL', shot: 'crosscourt drive'   },
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
 *  3. After two positions in the same zone, the next pick prefers a different zone.
 *  4. Re-shuffles the pool at every full cycle so identical patterns never repeat.
 */
function shuffleNoRepeat(pool: Position[], count: number): Position[] {
  if (pool.length === 0) return [];
  if (pool.length === 1) return Array(count).fill(pool[0]);

  const result: Position[] = [];
  let p = shuffle([...pool]);
  let prev1: Position | null = null;
  let prev2: Position | null = null;

  for (let i = 0; i < count; i++) {
    // Re-shuffle at every new cycle so patterns don't repeat identically
    if (i > 0 && i % pool.length === 0) p = shuffle([...pool]);

    // Build candidates excluding the last two positions
    let candidates = p.filter(pos => pos !== prev1 && pos !== prev2);
    if (candidates.length === 0) candidates = p.filter(pos => pos !== prev1);
    if (candidates.length === 0) candidates = [...p];

    // Zone balancing: if last two were in same zone, prefer a different zone
    if (prev1 && prev2 && POSITION_ZONE[prev1] === POSITION_ZONE[prev2]) {
      const diffZone = candidates.filter(pos => POSITION_ZONE[pos] !== POSITION_ZONE[prev1!]);
      if (diffZone.length > 0) candidates = diffZone;
    }

    const next = candidates[Math.floor(Math.random() * candidates.length)];
    result.push(next);
    prev2 = prev1;
    prev1 = next;
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

/**
 * Filters the base position pool to positions where the selected shot groups
 * have primary or secondary shots. This ensures shot-based drills only visit
 * positions where calling those shots is tactically realistic.
 * Falls back to the full pool when the filter produces fewer than 2 positions.
 */
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
    // Spec: +10% speed every 3 sets in match simulation (floored at 60% of base)
    const reduction = Math.floor(setIndex / 3) * 0.10;
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
          const shots = getShotsForPosition(shotLookupPos, config.shotGroups);
          const entry = pickShot(shots);
          shot = entry?.voiceText ?? null;
        }
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
      // Peek into what the next set would start with — save/restore state
      const savedMoveIndex = moveIndex;
      const savedSetIndex  = setIndex;
      const savedSeq       = sequence;
      const savedShots     = sequenceShots;
      setIndex++;
      moveIndex = 0;
      buildSet();
      const next = sequence[0] ?? null;
      // Restore
      setIndex      = savedSetIndex;
      moveIndex     = savedMoveIndex;
      sequence      = savedSeq;
      sequenceShots = savedShots;
      return next;
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
