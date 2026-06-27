import { Position } from '../types';

// ─── Fixed Pattern Library ────────────────────────────────────────────────────
// 100+ coach-approved movement patterns for ghosting drills.
// Each pattern is a repeating position sequence the engine cycles through.
// The engine selects patterns to prevent repetition across sets.

export type PatternCategory =
  | 'classic'       // Named benchmark patterns (Star, Figure-8, etc.)
  | 'zone'          // Zone-emphasis patterns (front-only, back-only, etc.)
  | 'diagonal'      // Diagonal and cross-court emphasis
  | 'extended'      // 10-point court patterns
  | 'fitness'       // High-intensity conditioning patterns
  | 'lateral'       // Width / side-to-side emphasis
  | 'depth'         // Front-back depth patterns
  | 'pressure'      // Pressure & retrieval drills

export interface FixedPattern {
  name: string;
  category: PatternCategory;
  positions: Position[];
  requires10pt?: boolean;  // only valid on 10-point court
}

export const FIXED_PATTERNS: FixedPattern[] = [

  // ══════════════════════════════════════════════════════════════════════════
  // CLASSIC NAMED PATTERNS
  // ══════════════════════════════════════════════════════════════════════════

  { name: 'Star',             category: 'classic',  positions: ['FL', 'BR', 'FR', 'BL', 'MR', 'ML'] },
  { name: 'Star Reverse',     category: 'classic',  positions: ['FR', 'BL', 'FL', 'BR', 'ML', 'MR'] },
  { name: 'Figure Eight',     category: 'classic',  positions: ['BR', 'FL', 'BL', 'FR', 'MR', 'ML'] },
  { name: 'Figure Eight Reverse', category: 'classic', positions: ['BL', 'FR', 'BR', 'FL', 'ML', 'MR'] },
  { name: 'Box',              category: 'classic',  positions: ['FL', 'FR', 'BR', 'BL'] },
  { name: 'Box Reverse',      category: 'classic',  positions: ['FL', 'BL', 'BR', 'FR'] },
  { name: 'Diamond',          category: 'classic',  positions: ['FL', 'MR', 'BR', 'ML'] },
  { name: 'Diamond Reverse',  category: 'classic',  positions: ['FR', 'ML', 'BL', 'MR'] },
  { name: 'Cross',            category: 'classic',  positions: ['FL', 'MR', 'BR', 'ML', 'FR'] },
  { name: 'Butterfly',        category: 'classic',  positions: ['BR', 'FL', 'FR', 'BL', 'MR', 'ML'] },
  { name: 'Butterfly Reverse', category: 'classic', positions: ['BL', 'FR', 'FL', 'BR', 'ML', 'MR'] },
  { name: 'Z-Pattern',        category: 'classic',  positions: ['FL', 'FR', 'BL', 'BR'] },
  { name: 'Z-Pattern Reverse', category: 'classic', positions: ['FR', 'FL', 'BR', 'BL'] },
  { name: 'Pentagon',         category: 'classic',  positions: ['FL', 'MR', 'BR', 'BL', 'ML'] },
  { name: 'Pentagon Reverse', category: 'classic',  positions: ['FR', 'ML', 'BL', 'BR', 'MR'] },
  { name: 'Full Six',         category: 'classic',  positions: ['FL', 'MR', 'BL', 'FR', 'ML', 'BR'] },
  { name: 'Full Six Reverse', category: 'classic',  positions: ['FR', 'ML', 'BR', 'FL', 'MR', 'BL'] },
  { name: 'Windmill',         category: 'classic',  positions: ['FL', 'BR', 'MR', 'BL', 'FR', 'ML'] },
  { name: 'Windmill Reverse', category: 'classic',  positions: ['FR', 'BL', 'ML', 'BR', 'FL', 'MR'] },
  { name: 'Hour Glass',       category: 'classic',  positions: ['FL', 'FR', 'ML', 'MR', 'BL', 'BR'] },

  // ══════════════════════════════════════════════════════════════════════════
  // ZONE PATTERNS — targeted zone emphasis
  // ══════════════════════════════════════════════════════════════════════════

  { name: 'Front Two',        category: 'zone',  positions: ['FL', 'FR'] },
  { name: 'Front Triangle',   category: 'zone',  positions: ['FL', 'FR', 'ML'] },
  { name: 'Front Triangle R', category: 'zone',  positions: ['FL', 'FR', 'MR'] },
  { name: 'Front Square',     category: 'zone',  positions: ['FL', 'FR', 'ML', 'MR'] },
  { name: 'Back Two',         category: 'zone',  positions: ['BL', 'BR'] },
  { name: 'Back Triangle',    category: 'zone',  positions: ['BL', 'BR', 'ML'] },
  { name: 'Back Triangle R',  category: 'zone',  positions: ['BL', 'BR', 'MR'] },
  { name: 'Back Square',      category: 'zone',  positions: ['BL', 'BR', 'ML', 'MR'] },
  { name: 'Mid Two',          category: 'zone',  positions: ['ML', 'MR'] },
  { name: 'Left Channel',     category: 'zone',  positions: ['FL', 'ML', 'BL'] },
  { name: 'Right Channel',    category: 'zone',  positions: ['FR', 'MR', 'BR'] },
  { name: 'Left Loop',        category: 'zone',  positions: ['FL', 'ML', 'BL', 'ML'] },
  { name: 'Right Loop',       category: 'zone',  positions: ['FR', 'MR', 'BR', 'MR'] },
  { name: 'Front-Mid L',      category: 'zone',  positions: ['FL', 'ML', 'FR'] },
  { name: 'Front-Mid R',      category: 'zone',  positions: ['FR', 'MR', 'FL'] },
  { name: 'Back-Mid L',       category: 'zone',  positions: ['FL', 'BL', 'FR'] },
  { name: 'Back-Mid R',       category: 'zone',  positions: ['FR', 'BR', 'FL'] },
  { name: 'Front Pressure',   category: 'zone',  positions: ['FL', 'FR', 'FL', 'FR', 'ML'] },
  { name: 'Back Pressure',    category: 'zone',  positions: ['BL', 'BR', 'BL', 'BR', 'ML'] },
  { name: 'Full Front',       category: 'zone',  positions: ['FL', 'FR', 'ML', 'MR', 'FL'] },

  // ══════════════════════════════════════════════════════════════════════════
  // DIAGONAL PATTERNS — crosscourt sprint emphasis
  // ══════════════════════════════════════════════════════════════════════════

  { name: 'Main Diagonal R',  category: 'diagonal', positions: ['BR', 'FL'] },
  { name: 'Main Diagonal L',  category: 'diagonal', positions: ['BL', 'FR'] },
  { name: 'Double Diagonal',  category: 'diagonal', positions: ['BR', 'FL', 'BL', 'FR'] },
  { name: 'Diagonal + Mid R', category: 'diagonal', positions: ['BR', 'FL', 'MR', 'FR'] },
  { name: 'Diagonal + Mid L', category: 'diagonal', positions: ['BL', 'FR', 'ML', 'FL'] },
  { name: 'Three Corner R',   category: 'diagonal', positions: ['BR', 'FL', 'MR'] },
  { name: 'Three Corner L',   category: 'diagonal', positions: ['BL', 'FR', 'ML'] },
  { name: 'Four Corner',      category: 'diagonal', positions: ['BR', 'FL', 'FR', 'BL'] },
  { name: 'Four Corner Alt',  category: 'diagonal', positions: ['BL', 'FR', 'FL', 'BR'] },
  { name: 'Cross Sprint',     category: 'diagonal', positions: ['BR', 'FR', 'FL', 'BL', 'ML', 'MR'] },
  { name: 'Push Pull',        category: 'diagonal', positions: ['BL', 'MR', 'BR', 'ML', 'FL', 'FR'] },
  { name: 'Sprint Star',      category: 'diagonal', positions: ['FL', 'BR', 'BL', 'MR', 'FR', 'ML'] },
  { name: 'Crosscourt Width', category: 'diagonal', positions: ['MR', 'BL', 'ML', 'BR'] },
  { name: 'Corner Chase R',   category: 'diagonal', positions: ['FL', 'BR', 'FR', 'BL'] },
  { name: 'Corner Chase L',   category: 'diagonal', positions: ['FR', 'BL', 'FL', 'BR'] },
  { name: 'Deep Diagonal R',  category: 'diagonal', positions: ['BR', 'FL', 'ML', 'BR'] },
  { name: 'Deep Diagonal L',  category: 'diagonal', positions: ['BL', 'FR', 'MR', 'BL'] },
  { name: 'Six-Point Cross',  category: 'diagonal', positions: ['BR', 'FL', 'ML', 'FR', 'BL', 'MR'] },
  { name: 'Diagonal Box',     category: 'diagonal', positions: ['FL', 'MR', 'BL', 'ML', 'BR', 'FR'] },
  { name: 'Double X',         category: 'diagonal', positions: ['BR', 'FL', 'FR', 'BL', 'MR', 'ML'] },

  // ══════════════════════════════════════════════════════════════════════════
  // LATERAL PATTERNS — width emphasis
  // ══════════════════════════════════════════════════════════════════════════

  { name: 'Width Front',      category: 'lateral', positions: ['FL', 'FR', 'FL', 'FR'] },
  { name: 'Width Mid',        category: 'lateral', positions: ['ML', 'MR', 'ML', 'MR'] },
  { name: 'Width Back',       category: 'lateral', positions: ['BL', 'BR', 'BL', 'BR'] },
  { name: 'Width Three Rows', category: 'lateral', positions: ['FL', 'FR', 'ML', 'MR', 'BL', 'BR'] },
  { name: 'Width Ladder Up',  category: 'lateral', positions: ['FL', 'FR', 'BL', 'BR', 'ML', 'MR'] },
  { name: 'Width Ladder Down', category: 'lateral', positions: ['BL', 'BR', 'ML', 'MR', 'FL', 'FR'] },
  { name: 'Front-Back Width', category: 'lateral', positions: ['FL', 'FR', 'BL', 'BR'] },
  { name: 'Chase Width R',    category: 'lateral', positions: ['MR', 'ML', 'MR', 'BR'] },
  { name: 'Chase Width L',    category: 'lateral', positions: ['ML', 'MR', 'ML', 'BL'] },
  { name: 'Lateral Ladder',   category: 'lateral', positions: ['ML', 'FL', 'MR', 'FR', 'ML', 'BL'] },

  // ══════════════════════════════════════════════════════════════════════════
  // DEPTH PATTERNS — front-back emphasis
  // ══════════════════════════════════════════════════════════════════════════

  { name: 'Depth Right',      category: 'depth', positions: ['FR', 'BR', 'FR', 'BR'] },
  { name: 'Depth Left',       category: 'depth', positions: ['FL', 'BL', 'FL', 'BL'] },
  { name: 'Depth Right+Mid',  category: 'depth', positions: ['FR', 'MR', 'BR', 'MR'] },
  { name: 'Depth Left+Mid',   category: 'depth', positions: ['FL', 'ML', 'BL', 'ML'] },
  { name: 'Depth Both',       category: 'depth', positions: ['FL', 'BL', 'FR', 'BR'] },
  { name: 'Depth Both Alt',   category: 'depth', positions: ['FR', 'BR', 'FL', 'BL'] },
  { name: 'Depth Sprint R',   category: 'depth', positions: ['FR', 'BR', 'MR', 'FR'] },
  { name: 'Depth Sprint L',   category: 'depth', positions: ['FL', 'BL', 'ML', 'FL'] },
  { name: 'Channel Right',    category: 'depth', positions: ['FR', 'MR', 'BR', 'MR', 'FR'] },
  { name: 'Channel Left',     category: 'depth', positions: ['FL', 'ML', 'BL', 'ML', 'FL'] },

  // ══════════════════════════════════════════════════════════════════════════
  // PRESSURE PATTERNS — retrieval & endurance
  // ══════════════════════════════════════════════════════════════════════════

  { name: 'Pressure Right',   category: 'pressure', positions: ['BR', 'FR', 'MR', 'BR'] },
  { name: 'Pressure Left',    category: 'pressure', positions: ['BL', 'FL', 'ML', 'BL'] },
  { name: 'Pressure Both',    category: 'pressure', positions: ['BR', 'FR', 'BL', 'FL'] },
  { name: 'Chase Right',      category: 'pressure', positions: ['FL', 'BR', 'FR', 'MR'] },
  { name: 'Chase Left',       category: 'pressure', positions: ['FR', 'BL', 'FL', 'ML'] },
  { name: 'Endurance Left',   category: 'pressure', positions: ['FL', 'ML', 'BL', 'ML'] },
  { name: 'Endurance Right',  category: 'pressure', positions: ['FR', 'MR', 'BR', 'MR'] },
  { name: 'Endurance Full',   category: 'pressure', positions: ['FL', 'MR', 'BR', 'ML', 'FR', 'MR', 'BL', 'ML'] },
  { name: 'No Rest Four',     category: 'pressure', positions: ['BR', 'FL', 'BL', 'FR'] },
  { name: 'No Rest Six',      category: 'pressure', positions: ['BR', 'FL', 'MR', 'BL', 'FR', 'ML'] },
  { name: 'No Rest Eight',    category: 'pressure', positions: ['BR', 'FL', 'MR', 'BL', 'FR', 'ML', 'BR', 'FL'] },
  { name: 'Conditioning Six', category: 'pressure', positions: ['FL', 'BR', 'ML', 'FR', 'BL', 'MR'] },
  { name: 'Triangle Left',    category: 'pressure', positions: ['FL', 'ML', 'BL'] },
  { name: 'Triangle Right',   category: 'pressure', positions: ['FR', 'MR', 'BR'] },
  { name: 'Triangle Front',   category: 'pressure', positions: ['FL', 'FR', 'MR'] },
  { name: 'Triangle Back',    category: 'pressure', positions: ['BL', 'BR', 'MR'] },
  { name: 'Agility Front',    category: 'pressure', positions: ['FR', 'FL', 'FR', 'FL', 'MR'] },
  { name: 'Agility Back',     category: 'pressure', positions: ['BR', 'BL', 'BR', 'BL', 'MR'] },
  { name: 'Interval Left',    category: 'pressure', positions: ['FL', 'BL', 'ML', 'FL'] },
  { name: 'Interval Right',   category: 'pressure', positions: ['FR', 'BR', 'MR', 'FR'] },

  // ══════════════════════════════════════════════════════════════════════════
  // FITNESS PATTERNS — high-rep endurance
  // ══════════════════════════════════════════════════════════════════════════

  { name: 'Full Court Sprint',  category: 'fitness', positions: ['FR', 'BR', 'BL', 'FL', 'ML', 'MR'] },
  { name: 'Oblique Six',        category: 'fitness', positions: ['BR', 'FL', 'MR', 'BL', 'FR', 'ML'] },
  { name: 'Non-Stop Four',      category: 'fitness', positions: ['FL', 'BR', 'BL', 'FR'] },
  { name: 'High-Rep Diagonal',  category: 'fitness', positions: ['BR', 'FL', 'BL', 'FR', 'BR', 'FL'] },
  { name: 'Full Width Depth',   category: 'fitness', positions: ['FL', 'BR', 'ML', 'MR', 'FL', 'BR'] },
  { name: 'Long Five',          category: 'fitness', positions: ['FL', 'BR', 'MR', 'BL', 'ML'] },
  { name: 'Long Five Alt',      category: 'fitness', positions: ['FR', 'BL', 'ML', 'BR', 'MR'] },
  { name: 'Eight Count',        category: 'fitness', positions: ['FL', 'BR', 'FR', 'BL', 'ML', 'MR', 'FL', 'BR'] },
  { name: 'Continuous Star',    category: 'fitness', positions: ['FL', 'BR', 'FR', 'BL', 'MR', 'ML', 'FL', 'BR'] },
  { name: 'Ladder Sprint',      category: 'fitness', positions: ['FL', 'ML', 'BL', 'BR', 'MR', 'FR'] },

  // ══════════════════════════════════════════════════════════════════════════
  // 10-POINT EXTENDED PATTERNS (requires 10pt court)
  // ══════════════════════════════════════════════════════════════════════════

  { name: 'Volley Width',       category: 'extended', requires10pt: true, positions: ['FMCL', 'FMCR'] },
  { name: 'Back Mid Width',     category: 'extended', requires10pt: true, positions: ['BMCL', 'BMCR'] },
  { name: 'Volley Intercept R', category: 'extended', requires10pt: true, positions: ['FMCR', 'BL', 'FMCL', 'BR'] },
  { name: 'Volley Intercept L', category: 'extended', requires10pt: true, positions: ['FMCL', 'BR', 'FMCR', 'BL'] },
  { name: '10pt Star',          category: 'extended', requires10pt: true, positions: ['FL', 'BMCR', 'FMCL', 'BR', 'MR', 'FR', 'BMCL', 'FMCR', 'BL', 'ML'] },
  { name: 'Full 10pt Diagonal R', category: 'extended', requires10pt: true, positions: ['FL', 'BR', 'FMCL', 'BMCR', 'MR'] },
  { name: 'Full 10pt Diagonal L', category: 'extended', requires10pt: true, positions: ['FR', 'BL', 'FMCR', 'BMCL', 'ML'] },
  { name: 'Mid Expansion',      category: 'extended', requires10pt: true, positions: ['ML', 'BMCL', 'FMCL', 'MR', 'BMCR', 'FMCR'] },
  { name: 'Volley Front Box',   category: 'extended', requires10pt: true, positions: ['FMCL', 'FMCR', 'FL', 'FR'] },
  { name: 'Back Mid Chase',     category: 'extended', requires10pt: true, positions: ['BMCL', 'BMCR', 'BL', 'BR'] },
  { name: 'Volley-Drop Circuit', category: 'extended', requires10pt: true, positions: ['FMCL', 'FMCR', 'BL', 'BR'] },
  { name: '10pt Figure Eight',  category: 'extended', requires10pt: true, positions: ['FL', 'BMCR', 'FMCL', 'BL', 'BMCL', 'FMCR', 'FR'] },
  { name: '10pt Pressure',      category: 'extended', requires10pt: true, positions: ['FMCR', 'BMCL', 'FMCL', 'BMCR', 'MR', 'ML'] },
  { name: 'Volley Diamond',     category: 'extended', requires10pt: true, positions: ['FMCL', 'BMCR', 'FMCR', 'BMCL'] },
  { name: 'Deep Sprint 10pt',   category: 'extended', requires10pt: true, positions: ['FL', 'BMCR', 'BL', 'BMCL', 'BR', 'FMCR'] },
];

// ─── Pattern Selection Helpers ────────────────────────────────────────────────

/** Returns all patterns valid for a given court system. */
export function getPatternsForCourt(is10pt: boolean): FixedPattern[] {
  return FIXED_PATTERNS.filter(p => is10pt ? true : !p.requires10pt);
}

/**
 * Pick the next pattern avoiding recently used ones.
 * Returns a pattern from the library, cycling with anti-repeat to maximise variety.
 */
export function pickNextPattern(
  is10pt: boolean,
  recentPatternNames: string[],
): FixedPattern {
  const available = getPatternsForCourt(is10pt);
  const cooldown = Math.min(recentPatternNames.length, Math.floor(available.length * 0.4));
  const recent   = new Set(recentPatternNames.slice(-cooldown));

  const pool = available.filter(p => !recent.has(p.name));
  const source = pool.length > 0 ? pool : available; // fallback if all on cooldown

  return source[Math.floor(Math.random() * source.length)];
}
