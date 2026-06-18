import { Position, PositionInfo, CourtSystem, Zone } from '../types';

// Complete position info with WSF-accurate coordinates.
// Origin: front-wall center. X = left(-)/right(+). Z = depth from front wall.
export const POSITION_INFO: Record<Position, PositionInfo> = {
  T: {
    code: 'T', label: 'the T', shortLabel: 'T',
    zone: 'mid', x: 0, z: 4.26,
    courtSystems: ['6pt', '10pt'],
  },
  // WSF 6-point ghosting positions.
  // x=±2.20 → 1.0m from side wall (SVG 100/540); sprite half-width 80px → left/right edge at 20/620, inside court boundary ✓
  // x=±2.00 → 1.2m from side wall (SVG 120/520) for mid positions — centred in service box area ✓
  FL: {
    code: 'FL', label: 'Front Left', shortLabel: 'FL',
    zone: 'front', x: -2.20, z: 1.00,
    courtSystems: ['6pt', '10pt'],
  },
  FR: {
    code: 'FR', label: 'Front Right', shortLabel: 'FR',
    zone: 'front', x: 2.20, z: 1.00,
    courtSystems: ['6pt', '10pt'],
  },
  ML: {
    code: 'ML', label: 'Mid Left', shortLabel: 'ML',
    zone: 'mid', x: -2.00, z: 4.60,
    courtSystems: ['6pt', '10pt'],
  },
  MR: {
    code: 'MR', label: 'Mid Right', shortLabel: 'MR',
    zone: 'mid', x: 2.00, z: 4.60,
    courtSystems: ['6pt', '10pt'],
  },
  BL: {
    code: 'BL', label: 'Back Left', shortLabel: 'BL',
    zone: 'back', x: -2.20, z: 8.50,
    courtSystems: ['6pt', '10pt'],
  },
  BR: {
    code: 'BR', label: 'Back Right', shortLabel: 'BR',
    zone: 'back', x: 2.20, z: 8.50,
    courtSystems: ['6pt', '10pt'],
  },
  // 10-point extra positions:
  // FMCL/FMCR = Front Volley zones — early interception before the ball reaches the front corner
  FMCL: {
    code: 'FMCL', label: 'Front Volley Left', shortLabel: 'FVL',
    zone: 'front', x: -2.00, z: 2.80,
    courtSystems: ['10pt'],
  },
  FMCR: {
    code: 'FMCR', label: 'Front Volley Right', shortLabel: 'FVR',
    zone: 'front', x: 2.00, z: 2.80,
    courtSystems: ['10pt'],
  },
  // BMCL/BMCR = Back Mid diagonal positions — between the T and back corners
  BMCL: {
    code: 'BMCL', label: 'Back Mid Left', shortLabel: 'BML',
    zone: 'back', x: -2.00, z: 6.50,
    courtSystems: ['10pt'],
  },
  BMCR: {
    code: 'BMCR', label: 'Back Mid Right', shortLabel: 'BMR',
    zone: 'back', x: 2.00, z: 6.50,
    courtSystems: ['10pt'],
  },
};

// T is the 7th movement position — recovery hub and volley intercept point.
export const POSITIONS_6PT: Position[] = ['FL', 'FR', 'ML', 'MR', 'BL', 'BR', 'T'];
export const POSITIONS_10PT: Position[] = ['FL', 'FR', 'ML', 'MR', 'BL', 'BR', 'T', 'FMCL', 'FMCR', 'BMCL', 'BMCR'];

// Fixed cyclic order — T placed at the natural recovery break in each sequence
export const FIXED_ORDER_6PT: Position[] = ['FL', 'FR', 'BL', 'BR', 'T', 'ML', 'MR'];
export const FIXED_ORDER_10PT: Position[] = ['FL', 'FR', 'FMCL', 'FMCR', 'T', 'ML', 'MR', 'BMCL', 'BMCR', 'BL', 'BR'];

// Handedness mirror: left-handed players swap all L↔R labels
export const HAND_MIRROR: Record<Position, Position> = {
  T: 'T',
  FL: 'FR', FR: 'FL',
  ML: 'MR', MR: 'ML',
  BL: 'BR', BR: 'BL',
  FMCL: 'FMCR', FMCR: 'FMCL',
  BMCL: 'BMCR', BMCR: 'BMCL',
};

// Coverage filter sets — right-handed defaults; engine mirrors for left-handed.
// T is only in 'full' — it's center court so it doesn't belong in side-only filters.
export const COVERAGE_FILTER: Record<string, Position[]> = {
  full:      POSITIONS_10PT,                                     // includes T via POSITIONS_10PT
  front:     ['FL', 'FR', 'FMCL', 'FMCR'],
  back:      ['BL', 'BR', 'BMCL', 'BMCR'],
  forehand:  ['FR', 'MR', 'BR', 'FMCR', 'BMCR'],
  backhand:  ['FL', 'ML', 'BL', 'FMCL', 'BMCL'],
};

// Zone mapping for analytics (3-zone: front / mid / back)
export const POSITION_ZONE: Record<Position, Zone> = {
  T:    'mid',
  FL:   'front', FR:   'front',
  ML:   'mid',   MR:   'mid',
  FMCL: 'front', FMCR: 'front',   // Front Volley positions are in the front zone
  BL:   'back',  BR:   'back',
  BMCL: 'back',  BMCR: 'back',
};

// WSF official court dimensions (meters)
export const COURT_DIMENSIONS = {
  width: 6.40,
  length: 9.75,
  shortLineFromFront: 4.26,
  serviceBoxSize: 1.60,
  tinHeight: 0.48,
  frontWallOutLine: 4.57,
} as const;

export function getPositionsForSystem(system: CourtSystem): Position[] {
  return system === '6pt' ? POSITIONS_6PT : POSITIONS_10PT;
}

export function mirrorPosition(pos: Position, hand: 'left' | 'right'): Position {
  return hand === 'left' ? HAND_MIRROR[pos] : pos;
}

export function getPositionLabel(pos: Position, hand: 'left' | 'right'): string {
  const effective = mirrorPosition(pos, hand);
  return POSITION_INFO[effective].label;
}
