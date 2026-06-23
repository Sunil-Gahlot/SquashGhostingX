import { Position, ShotEntry, ShotGroup, Difficulty } from '../types';

// Official GhostingX shot library — 18 core shots for v1.
//
// Naming convention: shots are POSITION-AGNOSTIC (no forehand/backhand prefix).
// The position announcement ("Front Right", "Back Left") already tells the
// player which hand to use — adding the hand to the shot name is redundant
// and inconsistent with how squash coaches call shots.
//
// Every entry is physically executable from that position in a real rally.
//
// Position hand rule:
//   Right side (FR, MR, BR, FMCR, BMCR) → forehand shots
//   Left  side (FL, ML, BL, FMCL, BMCL) → backhand shots
//   T (center) → either hand; shot names are already hand-neutral
//
// Weight priority order (matches PSA coaching principles):
//   1. Straight Drives / Lengths  → primary
//   2. Straight Drops / Straight Lobs → primary (front/back respectively)
//   3. Boasts (defensive escape)  → secondary
//   4. Crosscourt Drives          → secondary
//   5. Counter Drops / Crosscourt Drops → secondary
//   6. Advanced deception         → advanced
//
// Difficulty gating via WEIGHT_BY_DIFFICULTY:
//   beginner:     primary only (strong bias); secondary rarely; no advanced
//   intermediate: primary + secondary at standard ratio; no advanced
//   advanced+:    all shots; advanced shots unlocked progressively

// Per-difficulty repetition counts for each weight tier.
// Higher difficulty unlocks advanced shots; beginners focus on fundamentals.
const WEIGHT_BY_DIFFICULTY: Record<'primary' | 'secondary' | 'advanced', Record<Difficulty, number>> = {
  primary:   { beginner: 6, intermediate: 6, advanced: 6, elite: 6, pro: 6 },
  secondary: { beginner: 1, intermediate: 3, advanced: 3, elite: 3, pro: 3 },
  advanced:  { beginner: 0, intermediate: 0, advanced: 1, elite: 2, pro: 3 },
};

export const POSITION_SHOT_MATRIX: Record<Position, ShotEntry[]> = {

  // ── Front Right / Front Left (corner after bounce) ────────────────────────
  // Primary: straight drop + straight lob — the two fundamental front-corner
  // choices every player learns first: attack with the drop, escape with the lob.
  // Secondary: crosscourt drop (occasional tactic), kill, drive, counter drop, boast.
  // Crosscourt drop is SECONDARY (not primary) — it should be less frequent than
  // the straight drop in training to reflect match-play shot priority.

  FR: [
    { name: 'Straight Drop',    voiceText: 'straight drop',       weight: 'primary',   groups: ['drops',     'mixed'] },
    { name: 'Straight Lob',     voiceText: 'straight lob',        weight: 'primary',   groups: ['lobs',      'mixed'] },
    { name: 'Crosscourt Drop',  voiceText: 'crosscourt drop',     weight: 'secondary', groups: ['drops',     'mixed'] },
    { name: 'Straight Kill',    voiceText: 'straight kill',       weight: 'secondary', groups: ['kills',     'mixed'] },
    { name: 'Straight Drive',   voiceText: 'straight drive',      weight: 'secondary', groups: ['drives',    'mixed'] },
    { name: 'Counter Drop',     voiceText: 'counter drop',        weight: 'secondary', groups: ['drops',     'mixed'] },
    { name: 'Trickle Boast',    voiceText: 'trickle boast',       weight: 'secondary', groups: ['boasts',    'mixed'] },
    { name: 'Crosscourt Kill',  voiceText: 'crosscourt kill',     weight: 'advanced',  groups: ['kills',     'mixed'] },
    { name: 'Crosscourt Lob',   voiceText: 'crosscourt lob',      weight: 'advanced',  groups: ['lobs',      'mixed'] },
    { name: 'Crosscourt Drive', voiceText: 'crosscourt drive',    weight: 'advanced',  groups: ['drives',    'mixed'] },
    { name: 'Reverse Angle',    voiceText: 'reverse angle',       weight: 'advanced',  groups: ['deception', 'mixed'] },
  ],

  FL: [
    { name: 'Straight Drop',    voiceText: 'straight drop',       weight: 'primary',   groups: ['drops',     'mixed'] },
    { name: 'Straight Lob',     voiceText: 'straight lob',        weight: 'primary',   groups: ['lobs',      'mixed'] },
    { name: 'Crosscourt Drop',  voiceText: 'crosscourt drop',     weight: 'secondary', groups: ['drops',     'mixed'] },
    { name: 'Straight Kill',    voiceText: 'straight kill',       weight: 'secondary', groups: ['kills',     'mixed'] },
    { name: 'Straight Drive',   voiceText: 'straight drive',      weight: 'secondary', groups: ['drives',    'mixed'] },
    { name: 'Counter Drop',     voiceText: 'counter drop',        weight: 'secondary', groups: ['drops',     'mixed'] },
    { name: 'Trickle Boast',    voiceText: 'trickle boast',       weight: 'secondary', groups: ['boasts',    'mixed'] },
    { name: 'Crosscourt Kill',  voiceText: 'crosscourt kill',     weight: 'advanced',  groups: ['kills',     'mixed'] },
    { name: 'Crosscourt Lob',   voiceText: 'crosscourt lob',      weight: 'advanced',  groups: ['lobs',      'mixed'] },
    { name: 'Crosscourt Drive', voiceText: 'crosscourt drive',    weight: 'advanced',  groups: ['drives',    'mixed'] },
    { name: 'Reverse Angle',    voiceText: 'reverse angle',       weight: 'advanced',  groups: ['deception', 'mixed'] },
  ],

  // ── Mid Right / Mid Left (T area / service-line zone) ────────────────────
  // The primary decision-making zone. Drives and lengths dominate; drops and
  // boasts are attacking options; hold shots are advanced deception.

  MR: [
    { name: 'Straight Drive',   voiceText: 'straight drive',      weight: 'primary',   groups: ['drives',    'mixed'] },
    { name: 'Working Length',   voiceText: 'working length',      weight: 'primary',   groups: ['lengths',   'drives', 'mixed'] },
    { name: 'Crosscourt Drive', voiceText: 'crosscourt drive',    weight: 'secondary', groups: ['drives',    'mixed'] },
    { name: 'Hard Length',      voiceText: 'hard length',         weight: 'secondary', groups: ['lengths',   'drives', 'mixed'] },
    { name: 'Straight Drop',    voiceText: 'straight drop',       weight: 'secondary', groups: ['drops',     'mixed'] },
    { name: 'Straight Lob',     voiceText: 'straight lob',        weight: 'secondary', groups: ['lobs',      'mixed'] },
    { name: 'Crosscourt Lob',   voiceText: 'crosscourt lob',      weight: 'secondary', groups: ['lobs',      'mixed'] },
    { name: 'Volley Drive',     voiceText: 'volley drive',        weight: 'secondary', groups: ['volleys',   'drives', 'mixed'] },
    { name: 'Attacking Boast',  voiceText: 'attacking boast',     weight: 'secondary', groups: ['boasts',    'mixed'] },
    { name: 'Defensive Boast',  voiceText: 'defensive boast',     weight: 'secondary', groups: ['boasts',    'mixed'] },
    { name: 'Crosscourt Drop',  voiceText: 'crosscourt drop',     weight: 'secondary', groups: ['drops',     'mixed'] },
    { name: 'Dying Length',     voiceText: 'dying length',        weight: 'advanced',  groups: ['lengths',   'drops', 'mixed'] },
    { name: 'Volley Drop',      voiceText: 'volley drop',         weight: 'advanced',  groups: ['volleys',   'drops', 'mixed'] },
    { name: 'Hold & Drive',     voiceText: 'hold and drive',      weight: 'advanced',  groups: ['deception', 'drives', 'mixed'] },
    { name: 'Hold & Drop',      voiceText: 'hold and drop',       weight: 'advanced',  groups: ['deception', 'drops', 'mixed'] },
  ],

  ML: [
    { name: 'Straight Drive',   voiceText: 'straight drive',      weight: 'primary',   groups: ['drives',    'mixed'] },
    { name: 'Working Length',   voiceText: 'working length',      weight: 'primary',   groups: ['lengths',   'drives', 'mixed'] },
    { name: 'Crosscourt Drive', voiceText: 'crosscourt drive',    weight: 'secondary', groups: ['drives',    'mixed'] },
    { name: 'Hard Length',      voiceText: 'hard length',         weight: 'secondary', groups: ['lengths',   'drives', 'mixed'] },
    { name: 'Straight Drop',    voiceText: 'straight drop',       weight: 'secondary', groups: ['drops',     'mixed'] },
    { name: 'Straight Lob',     voiceText: 'straight lob',        weight: 'secondary', groups: ['lobs',      'mixed'] },
    { name: 'Crosscourt Lob',   voiceText: 'crosscourt lob',      weight: 'secondary', groups: ['lobs',      'mixed'] },
    { name: 'Volley Drive',     voiceText: 'volley drive',        weight: 'secondary', groups: ['volleys',   'drives', 'mixed'] },
    { name: 'Attacking Boast',  voiceText: 'attacking boast',     weight: 'secondary', groups: ['boasts',    'mixed'] },
    { name: 'Defensive Boast',  voiceText: 'defensive boast',     weight: 'secondary', groups: ['boasts',    'mixed'] },
    { name: 'Crosscourt Drop',  voiceText: 'crosscourt drop',     weight: 'secondary', groups: ['drops',     'mixed'] },
    { name: 'Dying Length',     voiceText: 'dying length',        weight: 'advanced',  groups: ['lengths',   'drops', 'mixed'] },
    { name: 'Volley Drop',      voiceText: 'volley drop',         weight: 'advanced',  groups: ['volleys',   'drops', 'mixed'] },
    { name: 'Hold & Drive',     voiceText: 'hold and drive',      weight: 'advanced',  groups: ['deception', 'drives', 'mixed'] },
    { name: 'Hold & Drop',      voiceText: 'hold and drop',       weight: 'advanced',  groups: ['deception', 'drops', 'mixed'] },
  ],

  // ── Back Right / Back Left (deep corner) ──────────────────────────────────
  // Primary: drives, lengths, defensive lob — fundamentals under pressure.
  // Secondary: crosscourt drive, lobs, defensive boast (beginner-accessible escape).
  // Advanced: back-court drops, reverse boast, deception.

  BR: [
    { name: 'Straight Drive',           voiceText: 'straight drive',          weight: 'primary',   groups: ['drives',    'mixed'] },
    { name: 'Hard Length',              voiceText: 'hard length',             weight: 'primary',   groups: ['lengths',   'drives', 'mixed'] },
    { name: 'Working Length',           voiceText: 'working length',          weight: 'primary',   groups: ['lengths',   'drives', 'mixed'] },
    { name: 'Defensive Lob',            voiceText: 'defensive lob',           weight: 'primary',   groups: ['lobs',      'mixed'] },
    { name: 'Crosscourt Drive',         voiceText: 'crosscourt drive',        weight: 'secondary', groups: ['drives',    'mixed'] },
    { name: 'Straight Lob',             voiceText: 'straight lob',            weight: 'secondary', groups: ['lobs',      'mixed'] },
    { name: 'Crosscourt Lob',           voiceText: 'crosscourt lob',          weight: 'secondary', groups: ['lobs',      'mixed'] },
    { name: 'Defensive Boast',          voiceText: 'defensive boast',         weight: 'secondary', groups: ['boasts',    'mixed'] },
    { name: 'Dying Length',             voiceText: 'dying length',            weight: 'advanced',  groups: ['lengths',   'drops', 'mixed'] },
    { name: 'Reverse Boast',            voiceText: 'reverse boast',           weight: 'advanced',  groups: ['boasts',    'mixed'] },
    { name: 'Back-Court Drop',          voiceText: 'back-court drop',         weight: 'advanced',  groups: ['drops',     'mixed'] },
    { name: 'Back-Court Crosscourt Drop', voiceText: 'back-court crosscourt drop', weight: 'advanced', groups: ['drops', 'mixed'] },
    { name: 'Hold & Drive',             voiceText: 'hold and drive',          weight: 'advanced',  groups: ['deception', 'drives', 'mixed'] },
    { name: 'Hold & Flick',             voiceText: 'hold and flick',          weight: 'advanced',  groups: ['deception', 'mixed'] },
  ],

  BL: [
    { name: 'Straight Drive',           voiceText: 'straight drive',          weight: 'primary',   groups: ['drives',    'mixed'] },
    { name: 'Hard Length',              voiceText: 'hard length',             weight: 'primary',   groups: ['lengths',   'drives', 'mixed'] },
    { name: 'Working Length',           voiceText: 'working length',          weight: 'primary',   groups: ['lengths',   'drives', 'mixed'] },
    { name: 'Defensive Lob',            voiceText: 'defensive lob',           weight: 'primary',   groups: ['lobs',      'mixed'] },
    { name: 'Crosscourt Drive',         voiceText: 'crosscourt drive',        weight: 'secondary', groups: ['drives',    'mixed'] },
    { name: 'Straight Lob',             voiceText: 'straight lob',            weight: 'secondary', groups: ['lobs',      'mixed'] },
    { name: 'Crosscourt Lob',           voiceText: 'crosscourt lob',          weight: 'secondary', groups: ['lobs',      'mixed'] },
    { name: 'Defensive Boast',          voiceText: 'defensive boast',         weight: 'secondary', groups: ['boasts',    'mixed'] },
    { name: 'Dying Length',             voiceText: 'dying length',            weight: 'advanced',  groups: ['lengths',   'drops', 'mixed'] },
    { name: 'Reverse Boast',            voiceText: 'reverse boast',           weight: 'advanced',  groups: ['boasts',    'mixed'] },
    { name: 'Back-Court Drop',          voiceText: 'back-court drop',         weight: 'advanced',  groups: ['drops',     'mixed'] },
    { name: 'Back-Court Crosscourt Drop', voiceText: 'back-court crosscourt drop', weight: 'advanced', groups: ['drops', 'mixed'] },
    { name: 'Hold & Drive',             voiceText: 'hold and drive',          weight: 'advanced',  groups: ['deception', 'drives', 'mixed'] },
    { name: 'Hold & Flick',             voiceText: 'hold and flick',          weight: 'advanced',  groups: ['deception', 'mixed'] },
  ],

  // ── Front Volley Right / Left (FMCR/FMCL — early interception zone) ───────
  // ALL shots here are volleys or deception holds — no after-bounce shots.
  // Volley Lob is secondary: a valid safety valve when under pressure at the net.

  FMCR: [
    { name: 'Volley Drive',     voiceText: 'volley drive',        weight: 'primary',   groups: ['volleys',   'drives', 'mixed'] },
    { name: 'Volley Drop',      voiceText: 'volley drop',         weight: 'primary',   groups: ['volleys',   'drops', 'mixed'] },
    { name: 'Volley Crosscourt',voiceText: 'volley crosscourt',   weight: 'secondary', groups: ['volleys',   'mixed'] },
    { name: 'Volley Kill',      voiceText: 'volley kill',         weight: 'secondary', groups: ['volleys',   'kills', 'mixed'] },
    { name: 'Volley Lob',       voiceText: 'volley lob',          weight: 'secondary', groups: ['volleys',   'lobs', 'mixed'] },
    { name: 'Hold & Flick',     voiceText: 'hold and flick',      weight: 'advanced',  groups: ['deception', 'mixed'] },
    { name: 'Hold & Drop',      voiceText: 'hold and drop',       weight: 'advanced',  groups: ['deception', 'drops', 'mixed'] },
  ],

  FMCL: [
    { name: 'Volley Drive',     voiceText: 'volley drive',        weight: 'primary',   groups: ['volleys',   'drives', 'mixed'] },
    { name: 'Volley Drop',      voiceText: 'volley drop',         weight: 'primary',   groups: ['volleys',   'drops', 'mixed'] },
    { name: 'Volley Crosscourt',voiceText: 'volley crosscourt',   weight: 'secondary', groups: ['volleys',   'mixed'] },
    { name: 'Volley Kill',      voiceText: 'volley kill',         weight: 'secondary', groups: ['volleys',   'kills', 'mixed'] },
    { name: 'Volley Lob',       voiceText: 'volley lob',          weight: 'secondary', groups: ['volleys',   'lobs', 'mixed'] },
    { name: 'Hold & Flick',     voiceText: 'hold and flick',      weight: 'advanced',  groups: ['deception', 'mixed'] },
    { name: 'Hold & Drop',      voiceText: 'hold and drop',       weight: 'advanced',  groups: ['deception', 'drops', 'mixed'] },
  ],

  // ── Back Mid Right / Left (BMCR/BMCL — mid-back diagonal) ────────────────
  // Between T and back corners. Drive and length options dominate.
  // Defensive Boast is secondary: accessible from beginner upward.

  BMCR: [
    { name: 'Straight Drive',   voiceText: 'straight drive',      weight: 'primary',   groups: ['drives',    'mixed'] },
    { name: 'Working Length',   voiceText: 'working length',      weight: 'primary',   groups: ['lengths',   'drives', 'mixed'] },
    { name: 'Hard Length',      voiceText: 'hard length',         weight: 'secondary', groups: ['lengths',   'drives', 'mixed'] },
    { name: 'Crosscourt Drive', voiceText: 'crosscourt drive',    weight: 'secondary', groups: ['drives',    'mixed'] },
    { name: 'Straight Lob',     voiceText: 'straight lob',        weight: 'secondary', groups: ['lobs',      'mixed'] },
    { name: 'Crosscourt Lob',   voiceText: 'crosscourt lob',      weight: 'secondary', groups: ['lobs',      'mixed'] },
    { name: 'Attacking Boast',  voiceText: 'attacking boast',     weight: 'secondary', groups: ['boasts',    'mixed'] },
    { name: 'Defensive Boast',  voiceText: 'defensive boast',     weight: 'secondary', groups: ['boasts',    'mixed'] },
    { name: 'Hold & Drive',     voiceText: 'hold and drive',      weight: 'advanced',  groups: ['deception', 'drives', 'mixed'] },
  ],

  BMCL: [
    { name: 'Straight Drive',   voiceText: 'straight drive',      weight: 'primary',   groups: ['drives',    'mixed'] },
    { name: 'Working Length',   voiceText: 'working length',      weight: 'primary',   groups: ['lengths',   'drives', 'mixed'] },
    { name: 'Hard Length',      voiceText: 'hard length',         weight: 'secondary', groups: ['lengths',   'drives', 'mixed'] },
    { name: 'Crosscourt Drive', voiceText: 'crosscourt drive',    weight: 'secondary', groups: ['drives',    'mixed'] },
    { name: 'Straight Lob',     voiceText: 'straight lob',        weight: 'secondary', groups: ['lobs',      'mixed'] },
    { name: 'Crosscourt Lob',   voiceText: 'crosscourt lob',      weight: 'secondary', groups: ['lobs',      'mixed'] },
    { name: 'Attacking Boast',  voiceText: 'attacking boast',     weight: 'secondary', groups: ['boasts',    'mixed'] },
    { name: 'Defensive Boast',  voiceText: 'defensive boast',     weight: 'secondary', groups: ['boasts',    'mixed'] },
    { name: 'Hold & Drive',     voiceText: 'hold and drive',      weight: 'advanced',  groups: ['deception', 'drives', 'mixed'] },
  ],

  // ── T Position (center recovery hub + volley intercept) ──────────────────
  // The T is where players recover between shots AND intercept loose balls.
  // All T shots are volleys or deception holds — no forehand/backhand prefix.

  T: [
    { name: 'Volley Drive',     voiceText: 'volley drive',        weight: 'primary',   groups: ['volleys',   'drives', 'mixed'] },
    { name: 'Volley Crosscourt',voiceText: 'volley crosscourt',   weight: 'primary',   groups: ['volleys',   'mixed'] },
    { name: 'Volley Drop',      voiceText: 'volley drop',         weight: 'secondary', groups: ['volleys',   'drops', 'mixed'] },
    { name: 'Volley Kill',      voiceText: 'volley kill',         weight: 'secondary', groups: ['volleys',   'kills', 'mixed'] },
    { name: 'Hold & Drive',     voiceText: 'hold and drive',      weight: 'advanced',  groups: ['deception', 'drives', 'mixed'] },
    { name: 'Hold & Drop',      voiceText: 'hold and drop',       weight: 'advanced',  groups: ['deception', 'drops', 'mixed'] },
    { name: 'Hold & Flick',     voiceText: 'hold and flick',      weight: 'advanced',  groups: ['deception', 'mixed'] },
    { name: 'Volley Lob',       voiceText: 'volley lob',          weight: 'advanced',  groups: ['volleys',   'lobs', 'mixed'] },
  ],
};

// Returns shots filtered by active shot groups, preserving weight distribution.
// Accepts an optional difficulty to exclude advanced shots below the player's level.
export function getShotsForPosition(
  position: Position,
  activeGroups: ShotGroup[],
  difficulty?: Difficulty
): ShotEntry[] {
  const all = POSITION_SHOT_MATRIX[position] ?? [];

  // Gate advanced shots: beginners and intermediates don't use advanced shots
  const weightAllowed = !difficulty || difficulty === 'advanced' || difficulty === 'elite' || difficulty === 'pro'
    ? ['primary', 'secondary', 'advanced'] as const
    : difficulty === 'intermediate'
      ? ['primary', 'secondary'] as const
      : ['primary', 'secondary'] as const; // beginner: secondary still included but at low count via pickShot

  const weightFiltered = all.filter(s => (weightAllowed as readonly string[]).includes(s.weight));
  if (activeGroups.includes('mixed')) return weightFiltered;
  return weightFiltered.filter((s) => s.groups.some((g) => activeGroups.includes(g)));
}

// Weighted random shot selection with difficulty scaling.
// primary/secondary/advanced counts per difficulty are defined in WEIGHT_BY_DIFFICULTY.
// This ensures beginners rarely hear crosscourt drops or deception shots,
// while advanced/pro players get the full realistic distribution.
export function pickShot(shots: ShotEntry[], difficulty?: Difficulty): ShotEntry | null {
  if (shots.length === 0) return null;

  const weighted: ShotEntry[] = [];
  for (const shot of shots) {
    const count = difficulty
      ? WEIGHT_BY_DIFFICULTY[shot.weight][difficulty]
      : (shot.weight === 'primary' ? 6 : shot.weight === 'secondary' ? 3 : 1);
    for (let i = 0; i < count; i++) weighted.push(shot);
  }

  // If all shots were gated to 0 (e.g. beginner with only advanced shots in pool),
  // fall back to giving each shot equal weight so there's always a call.
  if (weighted.length === 0) {
    return shots[Math.floor(Math.random() * shots.length)];
  }

  return weighted[Math.floor(Math.random() * weighted.length)];
}
