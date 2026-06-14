import { Position, ShotEntry, ShotGroup } from '../types';

// Complete position → shot mapping from spec Part E.
// Weights: primary=60%, secondary=30%, advanced=10% (used by ghosting engine).

export const POSITION_SHOT_MATRIX: Record<Position, ShotEntry[]> = {
  FR: [
    { name: 'Forehand Drive',         voiceText: 'forehand drive',        weight: 'primary',   groups: ['drives', 'mixed'] },
    { name: 'Forehand Cross Court',    voiceText: 'forehand cross court',  weight: 'secondary', groups: ['drives', 'cross', 'mixed'] },
    { name: 'Forehand Drop',           voiceText: 'forehand drop',         weight: 'primary',   groups: ['drops',  'mixed'] },
    { name: 'Forehand Boast',          voiceText: 'forehand boast',        weight: 'secondary', groups: ['boasts', 'mixed'] },
    { name: 'Forehand Volley',         voiceText: 'forehand volley',       weight: 'secondary', groups: ['volleys','mixed'] },
    { name: 'Forehand Lob',            voiceText: 'forehand lob',          weight: 'advanced',  groups: ['lobs',   'mixed'] },
    { name: 'Kill Shot',               voiceText: 'kill shot',             weight: 'advanced',  groups: ['kills',  'mixed'] },
  ],
  FL: [
    { name: 'Backhand Drive',          voiceText: 'backhand drive',        weight: 'primary',   groups: ['drives', 'mixed'] },
    { name: 'Backhand Cross Court',    voiceText: 'backhand cross court',  weight: 'secondary', groups: ['drives', 'cross', 'mixed'] },
    { name: 'Backhand Drop',           voiceText: 'backhand drop',         weight: 'primary',   groups: ['drops',  'mixed'] },
    { name: 'Backhand Boast',          voiceText: 'backhand boast',        weight: 'secondary', groups: ['boasts', 'mixed'] },
    { name: 'Backhand Volley',         voiceText: 'backhand volley',       weight: 'secondary', groups: ['volleys','mixed'] },
    { name: 'Backhand Lob',            voiceText: 'backhand lob',          weight: 'advanced',  groups: ['lobs',   'mixed'] },
    { name: 'Kill Shot',               voiceText: 'kill shot',             weight: 'advanced',  groups: ['kills',  'mixed'] },
  ],
  MR: [
    { name: 'Forehand Drive',          voiceText: 'forehand drive',        weight: 'primary',   groups: ['drives', 'mixed'] },
    { name: 'Forehand Volley',         voiceText: 'forehand volley',       weight: 'primary',   groups: ['volleys','mixed'] },
    { name: 'Forehand Cross Court',    voiceText: 'forehand cross court',  weight: 'secondary', groups: ['drives', 'cross', 'mixed'] },
    { name: 'Forehand Drop',           voiceText: 'forehand drop',         weight: 'secondary', groups: ['drops',  'mixed'] },
    { name: 'Forehand Boast',          voiceText: 'forehand boast',        weight: 'advanced',  groups: ['boasts', 'mixed'] },
  ],
  ML: [
    { name: 'Backhand Drive',          voiceText: 'backhand drive',        weight: 'primary',   groups: ['drives', 'mixed'] },
    { name: 'Backhand Volley',         voiceText: 'backhand volley',       weight: 'primary',   groups: ['volleys','mixed'] },
    { name: 'Backhand Cross Court',    voiceText: 'backhand cross court',  weight: 'secondary', groups: ['drives', 'cross', 'mixed'] },
    { name: 'Backhand Drop',           voiceText: 'backhand drop',         weight: 'secondary', groups: ['drops',  'mixed'] },
    { name: 'Backhand Boast',          voiceText: 'backhand boast',        weight: 'advanced',  groups: ['boasts', 'mixed'] },
  ],
  BR: [
    { name: 'Forehand Drive (Length)', voiceText: 'forehand drive',        weight: 'primary',   groups: ['drives', 'mixed'] },
    { name: 'Forehand Cross Court',    voiceText: 'forehand cross court',  weight: 'secondary', groups: ['drives', 'cross', 'mixed'] },
    { name: 'Forehand Lob',            voiceText: 'forehand lob',          weight: 'primary',   groups: ['lobs',   'mixed'] },
    { name: 'Forehand Boast',          voiceText: 'forehand boast',        weight: 'secondary', groups: ['boasts', 'mixed'] },
    { name: 'Forehand Drop',           voiceText: 'forehand drop',         weight: 'advanced',  groups: ['drops',  'mixed'] },
  ],
  BL: [
    { name: 'Backhand Drive (Length)', voiceText: 'backhand drive',        weight: 'primary',   groups: ['drives', 'mixed'] },
    { name: 'Backhand Cross Court',    voiceText: 'backhand cross court',  weight: 'secondary', groups: ['drives', 'cross', 'mixed'] },
    { name: 'Backhand Lob',            voiceText: 'backhand lob',          weight: 'primary',   groups: ['lobs',   'mixed'] },
    { name: 'Backhand Boast',          voiceText: 'backhand boast',        weight: 'secondary', groups: ['boasts', 'mixed'] },
    { name: 'Backhand Drop',           voiceText: 'backhand drop',         weight: 'advanced',  groups: ['drops',  'mixed'] },
  ],
  FMCR: [
    { name: 'Forehand Volley',         voiceText: 'forehand volley',       weight: 'primary',   groups: ['volleys','mixed'] },
    { name: 'Forehand Drive',          voiceText: 'forehand drive',        weight: 'secondary', groups: ['drives', 'mixed'] },
    { name: 'Forehand Drop',           voiceText: 'forehand drop',         weight: 'secondary', groups: ['drops',  'mixed'] },
    { name: 'Kill Shot',               voiceText: 'kill shot',             weight: 'advanced',  groups: ['kills',  'mixed'] },
    { name: 'Forehand Lob',            voiceText: 'forehand lob',          weight: 'advanced',  groups: ['lobs',   'mixed'] },
  ],
  FMCL: [
    { name: 'Backhand Volley',         voiceText: 'backhand volley',       weight: 'primary',   groups: ['volleys','mixed'] },
    { name: 'Backhand Drive',          voiceText: 'backhand drive',        weight: 'secondary', groups: ['drives', 'mixed'] },
    { name: 'Backhand Drop',           voiceText: 'backhand drop',         weight: 'secondary', groups: ['drops',  'mixed'] },
    { name: 'Kill Shot',               voiceText: 'kill shot',             weight: 'advanced',  groups: ['kills',  'mixed'] },
    { name: 'Backhand Lob',            voiceText: 'backhand lob',          weight: 'advanced',  groups: ['lobs',   'mixed'] },
  ],
  BMCR: [
    { name: 'Forehand Drive',          voiceText: 'forehand drive',        weight: 'primary',   groups: ['drives', 'mixed'] },
    { name: 'Forehand Cross Court',    voiceText: 'forehand cross court',  weight: 'secondary', groups: ['drives', 'cross', 'mixed'] },
    { name: 'Forehand Lob',            voiceText: 'forehand lob',          weight: 'secondary', groups: ['lobs',   'mixed'] },
    { name: 'Forehand Boast',          voiceText: 'forehand boast',        weight: 'advanced',  groups: ['boasts', 'mixed'] },
    { name: 'Forehand Drop',           voiceText: 'forehand drop',         weight: 'advanced',  groups: ['drops',  'mixed'] },
  ],
  BMCL: [
    { name: 'Backhand Drive',          voiceText: 'backhand drive',        weight: 'primary',   groups: ['drives', 'mixed'] },
    { name: 'Backhand Cross Court',    voiceText: 'backhand cross court',  weight: 'secondary', groups: ['drives', 'cross', 'mixed'] },
    { name: 'Backhand Lob',            voiceText: 'backhand lob',          weight: 'secondary', groups: ['lobs',   'mixed'] },
    { name: 'Backhand Boast',          voiceText: 'backhand boast',        weight: 'advanced',  groups: ['boasts', 'mixed'] },
    { name: 'Backhand Drop',           voiceText: 'backhand drop',         weight: 'advanced',  groups: ['drops',  'mixed'] },
  ],
  T: [
    { name: 'Forehand Volley Deep',    voiceText: 'forehand volley deep',  weight: 'primary',   groups: ['volleys','mixed'] },
    { name: 'Backhand Volley Deep',    voiceText: 'backhand volley deep',  weight: 'primary',   groups: ['volleys','mixed'] },
    { name: 'Forehand Volley Cross',   voiceText: 'forehand cross volley', weight: 'secondary', groups: ['volleys', 'cross', 'mixed'] },
    { name: 'Backhand Volley Cross',   voiceText: 'backhand cross volley', weight: 'secondary', groups: ['volleys', 'cross', 'mixed'] },
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
