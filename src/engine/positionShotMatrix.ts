import { Position, ShotEntry, ShotGroup } from '../types';

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
// Weights: primary=60%, secondary=30%, advanced=10%

export const POSITION_SHOT_MATRIX: Record<Position, ShotEntry[]> = {

  // ── Front Right / Front Left (corner after bounce) ────────────────────────
  // Primary options: drops and kills — the dominant shots from a front corner.
  // Lobs and boasts are escape options. Reverse angle is elite-level deception.

  FR: [
    { name: 'Straight Drop',     voiceText: 'straight drop',       weight: 'primary',   groups: ['drops',     'mixed'] },
    { name: 'Crosscourt Drop',   voiceText: 'crosscourt drop',     weight: 'primary',   groups: ['drops',     'mixed'] },
    { name: 'Straight Kill',     voiceText: 'straight kill',       weight: 'secondary', groups: ['kills',     'mixed'] },
    { name: 'Straight Lob',      voiceText: 'straight lob',        weight: 'secondary', groups: ['lobs',      'mixed'] },
    { name: 'Straight Boast',    voiceText: 'straight boast',      weight: 'secondary', groups: ['boasts',    'mixed'] },
    { name: 'Straight Drive',    voiceText: 'straight drive',      weight: 'secondary', groups: ['drives',    'mixed'] },
    { name: 'Crosscourt Kill',   voiceText: 'crosscourt kill',     weight: 'advanced',  groups: ['kills',     'mixed'] },
    { name: 'Counter Drop',      voiceText: 'counter drop',        weight: 'advanced',  groups: ['drops',     'mixed'] },
    { name: 'Crosscourt Lob',    voiceText: 'crosscourt lob',      weight: 'advanced',  groups: ['lobs',      'mixed'] },
    { name: 'Crosscourt Drive',  voiceText: 'crosscourt drive',    weight: 'advanced',  groups: ['drives',    'mixed'] },
    { name: 'Reverse Angle',     voiceText: 'reverse angle',       weight: 'advanced',  groups: ['deception', 'mixed'] },
  ],

  FL: [
    { name: 'Straight Drop',     voiceText: 'straight drop',       weight: 'primary',   groups: ['drops',     'mixed'] },
    { name: 'Crosscourt Drop',   voiceText: 'crosscourt drop',     weight: 'primary',   groups: ['drops',     'mixed'] },
    { name: 'Straight Kill',     voiceText: 'straight kill',       weight: 'secondary', groups: ['kills',     'mixed'] },
    { name: 'Straight Lob',      voiceText: 'straight lob',        weight: 'secondary', groups: ['lobs',      'mixed'] },
    { name: 'Straight Boast',    voiceText: 'straight boast',      weight: 'secondary', groups: ['boasts',    'mixed'] },
    { name: 'Straight Drive',    voiceText: 'straight drive',      weight: 'secondary', groups: ['drives',    'mixed'] },
    { name: 'Crosscourt Kill',   voiceText: 'crosscourt kill',     weight: 'advanced',  groups: ['kills',     'mixed'] },
    { name: 'Counter Drop',      voiceText: 'counter drop',        weight: 'advanced',  groups: ['drops',     'mixed'] },
    { name: 'Crosscourt Lob',    voiceText: 'crosscourt lob',      weight: 'advanced',  groups: ['lobs',      'mixed'] },
    { name: 'Crosscourt Drive',  voiceText: 'crosscourt drive',    weight: 'advanced',  groups: ['drives',    'mixed'] },
    { name: 'Reverse Angle',     voiceText: 'reverse angle',       weight: 'advanced',  groups: ['deception', 'mixed'] },
  ],

  // ── Mid Right / Mid Left (T area / service-line zone) ────────────────────
  // The primary decision-making zone. Drives and lengths dominate; drops and
  // boasts are attacking options; hold shots are advanced deception.

  MR: [
    { name: 'Straight Drive',    voiceText: 'straight drive',      weight: 'primary',   groups: ['drives',    'mixed'] },
    { name: 'Working Length',    voiceText: 'working length',      weight: 'primary',   groups: ['lengths',   'drives', 'mixed'] },
    { name: 'Crosscourt Drive',  voiceText: 'crosscourt drive',    weight: 'secondary', groups: ['drives',    'mixed'] },
    { name: 'Hard Length',       voiceText: 'hard length',         weight: 'secondary', groups: ['lengths',   'drives', 'mixed'] },
    { name: 'Straight Drop',     voiceText: 'straight drop',       weight: 'secondary', groups: ['drops',     'mixed'] },
    { name: 'Crosscourt Drop',   voiceText: 'crosscourt drop',     weight: 'secondary', groups: ['drops',     'mixed'] },
    { name: 'Straight Lob',      voiceText: 'straight lob',        weight: 'secondary', groups: ['lobs',      'mixed'] },
    { name: 'Crosscourt Lob',    voiceText: 'crosscourt lob',      weight: 'secondary', groups: ['lobs',      'mixed'] },
    { name: 'Volley Drive',      voiceText: 'volley drive',        weight: 'secondary', groups: ['volleys',   'drives', 'mixed'] },
    { name: 'Attacking Boast',   voiceText: 'attacking boast',     weight: 'advanced',  groups: ['boasts',    'mixed'] },
    { name: 'Defensive Boast',   voiceText: 'defensive boast',     weight: 'advanced',  groups: ['boasts',    'mixed'] },
    { name: 'Dying Length',      voiceText: 'dying length',        weight: 'advanced',  groups: ['lengths',   'drops', 'mixed'] },
    { name: 'Volley Drop',       voiceText: 'volley drop',         weight: 'advanced',  groups: ['volleys',   'drops', 'mixed'] },
    { name: 'Hold & Drive',      voiceText: 'hold and drive',      weight: 'advanced',  groups: ['deception', 'drives', 'mixed'] },
    { name: 'Hold & Drop',       voiceText: 'hold and drop',       weight: 'advanced',  groups: ['deception', 'drops', 'mixed'] },
  ],

  ML: [
    { name: 'Straight Drive',    voiceText: 'straight drive',      weight: 'primary',   groups: ['drives',    'mixed'] },
    { name: 'Working Length',    voiceText: 'working length',      weight: 'primary',   groups: ['lengths',   'drives', 'mixed'] },
    { name: 'Crosscourt Drive',  voiceText: 'crosscourt drive',    weight: 'secondary', groups: ['drives',    'mixed'] },
    { name: 'Hard Length',       voiceText: 'hard length',         weight: 'secondary', groups: ['lengths',   'drives', 'mixed'] },
    { name: 'Straight Drop',     voiceText: 'straight drop',       weight: 'secondary', groups: ['drops',     'mixed'] },
    { name: 'Crosscourt Drop',   voiceText: 'crosscourt drop',     weight: 'secondary', groups: ['drops',     'mixed'] },
    { name: 'Straight Lob',      voiceText: 'straight lob',        weight: 'secondary', groups: ['lobs',      'mixed'] },
    { name: 'Crosscourt Lob',    voiceText: 'crosscourt lob',      weight: 'secondary', groups: ['lobs',      'mixed'] },
    { name: 'Volley Drive',      voiceText: 'volley drive',        weight: 'secondary', groups: ['volleys',   'drives', 'mixed'] },
    { name: 'Attacking Boast',   voiceText: 'attacking boast',     weight: 'advanced',  groups: ['boasts',    'mixed'] },
    { name: 'Defensive Boast',   voiceText: 'defensive boast',     weight: 'advanced',  groups: ['boasts',    'mixed'] },
    { name: 'Dying Length',      voiceText: 'dying length',        weight: 'advanced',  groups: ['lengths',   'drops', 'mixed'] },
    { name: 'Volley Drop',       voiceText: 'volley drop',         weight: 'advanced',  groups: ['volleys',   'drops', 'mixed'] },
    { name: 'Hold & Drive',      voiceText: 'hold and drive',      weight: 'advanced',  groups: ['deception', 'drives', 'mixed'] },
    { name: 'Hold & Drop',       voiceText: 'hold and drop',       weight: 'advanced',  groups: ['deception', 'drops', 'mixed'] },
  ],

  // ── Back Right / Back Left (deep corner) ──────────────────────────────────
  // Primary: drives and lengths to maintain pressure. Defensive lob is the
  // safety option. Back-court drop is an advanced attacking shot (Ramy-style).
  // No standard drops — back-court drops are explicitly named to distinguish
  // them from mid/front drops.

  BR: [
    { name: 'Straight Drive',        voiceText: 'straight drive',          weight: 'primary',   groups: ['drives',    'mixed'] },
    { name: 'Hard Length',           voiceText: 'hard length',             weight: 'primary',   groups: ['lengths',   'drives', 'mixed'] },
    { name: 'Working Length',        voiceText: 'working length',          weight: 'primary',   groups: ['lengths',   'drives', 'mixed'] },
    { name: 'Defensive Lob',         voiceText: 'defensive lob',           weight: 'primary',   groups: ['lobs',      'mixed'] },
    { name: 'Crosscourt Drive',      voiceText: 'crosscourt drive',        weight: 'secondary', groups: ['drives',    'mixed'] },
    { name: 'Straight Lob',          voiceText: 'straight lob',            weight: 'secondary', groups: ['lobs',      'mixed'] },
    { name: 'Crosscourt Lob',        voiceText: 'crosscourt lob',          weight: 'secondary', groups: ['lobs',      'mixed'] },
    { name: 'Defensive Boast',       voiceText: 'defensive boast',         weight: 'secondary', groups: ['boasts',    'mixed'] },
    { name: 'Dying Length',          voiceText: 'dying length',            weight: 'advanced',  groups: ['lengths',   'drops', 'mixed'] },
    { name: 'Reverse Boast',         voiceText: 'reverse boast',           weight: 'advanced',  groups: ['boasts',    'mixed'] },
    { name: 'Back-Court Drop',       voiceText: 'back-court drop',         weight: 'advanced',  groups: ['drops',     'mixed'] },
    { name: 'Hold & Drive',          voiceText: 'hold and drive',          weight: 'advanced',  groups: ['deception', 'drives', 'mixed'] },
    { name: 'Hold & Flick',          voiceText: 'hold and flick',          weight: 'advanced',  groups: ['deception', 'mixed'] },
  ],

  BL: [
    { name: 'Straight Drive',        voiceText: 'straight drive',          weight: 'primary',   groups: ['drives',    'mixed'] },
    { name: 'Hard Length',           voiceText: 'hard length',             weight: 'primary',   groups: ['lengths',   'drives', 'mixed'] },
    { name: 'Working Length',        voiceText: 'working length',          weight: 'primary',   groups: ['lengths',   'drives', 'mixed'] },
    { name: 'Defensive Lob',         voiceText: 'defensive lob',           weight: 'primary',   groups: ['lobs',      'mixed'] },
    { name: 'Crosscourt Drive',      voiceText: 'crosscourt drive',        weight: 'secondary', groups: ['drives',    'mixed'] },
    { name: 'Straight Lob',          voiceText: 'straight lob',            weight: 'secondary', groups: ['lobs',      'mixed'] },
    { name: 'Crosscourt Lob',        voiceText: 'crosscourt lob',          weight: 'secondary', groups: ['lobs',      'mixed'] },
    { name: 'Defensive Boast',       voiceText: 'defensive boast',         weight: 'secondary', groups: ['boasts',    'mixed'] },
    { name: 'Dying Length',          voiceText: 'dying length',            weight: 'advanced',  groups: ['lengths',   'drops', 'mixed'] },
    { name: 'Reverse Boast',         voiceText: 'reverse boast',           weight: 'advanced',  groups: ['boasts',    'mixed'] },
    { name: 'Back-Court Drop',       voiceText: 'back-court drop',         weight: 'advanced',  groups: ['drops',     'mixed'] },
    { name: 'Hold & Drive',          voiceText: 'hold and drive',          weight: 'advanced',  groups: ['deception', 'drives', 'mixed'] },
    { name: 'Hold & Flick',          voiceText: 'hold and flick',          weight: 'advanced',  groups: ['deception', 'mixed'] },
  ],

  // ── Front Volley Right / Left (FMCR/FMCL — early interception zone) ───────
  // The volley intercept zone before the ball reaches the front corner.
  // ALL shots here are volleys or deception holds — no after-bounce shots.

  FMCR: [
    { name: 'Volley Drive',      voiceText: 'volley drive',        weight: 'primary',   groups: ['volleys',   'drives', 'mixed'] },
    { name: 'Volley Drop',       voiceText: 'volley drop',         weight: 'primary',   groups: ['volleys',   'drops', 'mixed'] },
    { name: 'Volley Crosscourt', voiceText: 'volley crosscourt',   weight: 'secondary', groups: ['volleys',   'mixed'] },
    { name: 'Volley Kill',       voiceText: 'volley kill',         weight: 'secondary', groups: ['volleys',   'kills', 'mixed'] },
    { name: 'Hold & Flick',      voiceText: 'hold and flick',      weight: 'advanced',  groups: ['deception', 'mixed'] },
    { name: 'Hold & Drop',       voiceText: 'hold and drop',       weight: 'advanced',  groups: ['deception', 'drops', 'mixed'] },
    { name: 'Volley Lob',        voiceText: 'volley lob',          weight: 'advanced',  groups: ['volleys',   'lobs', 'mixed'] },
  ],

  FMCL: [
    { name: 'Volley Drive',      voiceText: 'volley drive',        weight: 'primary',   groups: ['volleys',   'drives', 'mixed'] },
    { name: 'Volley Drop',       voiceText: 'volley drop',         weight: 'primary',   groups: ['volleys',   'drops', 'mixed'] },
    { name: 'Volley Crosscourt', voiceText: 'volley crosscourt',   weight: 'secondary', groups: ['volleys',   'mixed'] },
    { name: 'Volley Kill',       voiceText: 'volley kill',         weight: 'secondary', groups: ['volleys',   'kills', 'mixed'] },
    { name: 'Hold & Flick',      voiceText: 'hold and flick',      weight: 'advanced',  groups: ['deception', 'mixed'] },
    { name: 'Hold & Drop',       voiceText: 'hold and drop',       weight: 'advanced',  groups: ['deception', 'drops', 'mixed'] },
    { name: 'Volley Lob',        voiceText: 'volley lob',          weight: 'advanced',  groups: ['volleys',   'lobs', 'mixed'] },
  ],

  // ── Back Mid Right / Left (BMCR/BMCL — mid-back diagonal) ────────────────
  // Between the T and back corners. Drive and length options dominate.

  BMCR: [
    { name: 'Straight Drive',    voiceText: 'straight drive',      weight: 'primary',   groups: ['drives',    'mixed'] },
    { name: 'Working Length',    voiceText: 'working length',      weight: 'primary',   groups: ['lengths',   'drives', 'mixed'] },
    { name: 'Hard Length',       voiceText: 'hard length',         weight: 'secondary', groups: ['lengths',   'drives', 'mixed'] },
    { name: 'Crosscourt Drive',  voiceText: 'crosscourt drive',    weight: 'secondary', groups: ['drives',    'mixed'] },
    { name: 'Straight Lob',      voiceText: 'straight lob',        weight: 'secondary', groups: ['lobs',      'mixed'] },
    { name: 'Crosscourt Lob',    voiceText: 'crosscourt lob',      weight: 'secondary', groups: ['lobs',      'mixed'] },
    { name: 'Defensive Boast',   voiceText: 'defensive boast',     weight: 'advanced',  groups: ['boasts',    'mixed'] },
    { name: 'Attacking Boast',   voiceText: 'attacking boast',     weight: 'advanced',  groups: ['boasts',    'mixed'] },
    { name: 'Hold & Drive',      voiceText: 'hold and drive',      weight: 'advanced',  groups: ['deception', 'drives', 'mixed'] },
  ],

  BMCL: [
    { name: 'Straight Drive',    voiceText: 'straight drive',      weight: 'primary',   groups: ['drives',    'mixed'] },
    { name: 'Working Length',    voiceText: 'working length',      weight: 'primary',   groups: ['lengths',   'drives', 'mixed'] },
    { name: 'Hard Length',       voiceText: 'hard length',         weight: 'secondary', groups: ['lengths',   'drives', 'mixed'] },
    { name: 'Crosscourt Drive',  voiceText: 'crosscourt drive',    weight: 'secondary', groups: ['drives',    'mixed'] },
    { name: 'Straight Lob',      voiceText: 'straight lob',        weight: 'secondary', groups: ['lobs',      'mixed'] },
    { name: 'Crosscourt Lob',    voiceText: 'crosscourt lob',      weight: 'secondary', groups: ['lobs',      'mixed'] },
    { name: 'Defensive Boast',   voiceText: 'defensive boast',     weight: 'advanced',  groups: ['boasts',    'mixed'] },
    { name: 'Attacking Boast',   voiceText: 'attacking boast',     weight: 'advanced',  groups: ['boasts',    'mixed'] },
    { name: 'Hold & Drive',      voiceText: 'hold and drive',      weight: 'advanced',  groups: ['deception', 'drives', 'mixed'] },
  ],

  // ── T Position (center recovery hub + volley intercept) ──────────────────
  // The T is where players recover between shots AND where they intercept
  // loose balls with volleys. All T shots are volleys or deception holds.
  // No forehand/backhand prefix — at the T, either hand can be used.

  T: [
    { name: 'Volley Drive',      voiceText: 'volley drive',        weight: 'primary',   groups: ['volleys',   'drives', 'mixed'] },
    { name: 'Volley Crosscourt', voiceText: 'volley crosscourt',   weight: 'primary',   groups: ['volleys',   'mixed'] },
    { name: 'Volley Drop',       voiceText: 'volley drop',         weight: 'secondary', groups: ['volleys',   'drops', 'mixed'] },
    { name: 'Volley Kill',       voiceText: 'volley kill',         weight: 'secondary', groups: ['volleys',   'kills', 'mixed'] },
    { name: 'Hold & Drive',      voiceText: 'hold and drive',      weight: 'advanced',  groups: ['deception', 'drives', 'mixed'] },
    { name: 'Hold & Drop',       voiceText: 'hold and drop',       weight: 'advanced',  groups: ['deception', 'drops', 'mixed'] },
    { name: 'Hold & Flick',      voiceText: 'hold and flick',      weight: 'advanced',  groups: ['deception', 'mixed'] },
    { name: 'Volley Lob',        voiceText: 'volley lob',          weight: 'advanced',  groups: ['volleys',   'lobs', 'mixed'] },
  ],
};

// Returns shots filtered by active shot groups, preserving weight distribution.
export function getShotsForPosition(
  position: Position,
  activeGroups: ShotGroup[]
): ShotEntry[] {
  const all = POSITION_SHOT_MATRIX[position] ?? [];
  if (activeGroups.includes('mixed')) return all;
  return all.filter((s) => s.groups.some((g) => activeGroups.includes(g)));
}

// Weighted random shot selection: primary=60%, secondary=30%, advanced=10%.
export function pickShot(shots: ShotEntry[]): ShotEntry | null {
  if (shots.length === 0) return null;

  const weighted: ShotEntry[] = [];
  for (const shot of shots) {
    const count = shot.weight === 'primary' ? 6 : shot.weight === 'secondary' ? 3 : 1;
    for (let i = 0; i < count; i++) weighted.push(shot);
  }
  return weighted[Math.floor(Math.random() * weighted.length)];
}
