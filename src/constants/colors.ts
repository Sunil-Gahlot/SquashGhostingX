export const Colors = {
  // ─── Base backgrounds ─────────────────────────────────────────────────────
  background:       '#0A0A0A',   // near-black — warmer than pure black, more premium
  surface:          '#161616',   // card/panel surfaces
  surfaceElevated:  '#1F1F1F',   // modals, sheets, elevated cards
  surfaceHighlight: '#2A2A2A',   // pressed states

  // ─── Brand — GhostingX Orange ────────────────────────────────────────────
  brand:       '#FF6B35',                      // primary brand orange (matches refs)
  brandDim:    '#E85A28',
  brandMuted:  'rgba(255, 107, 53, 0.15)',
  brandSoft:   'rgba(255, 107, 53, 0.08)',

  // ─── Per-screen hero tint backgrounds ─────────────────────────────────────
  // Each screen has a distinct dark-tinted hero — same structure as refs, premium dark execution
  heroTrain:    '#160800',   // warm dark orange — Train / Home
  heroRoutines: '#041208',   // dark forest green — Routines
  heroProgress: '#020A18',   // deep navy — Progress
  heroLibrary:  '#0C0418',   // dark violet — Library
  heroSettings: '#08101A',   // dark slate — Settings

  // ─── Per-screen accent colors ─────────────────────────────────────────────
  accentTrain:    '#FF6B35',   // orange
  accentRoutines: '#34C759',   // green
  accentProgress: '#0A84FF',   // blue
  accentLibrary:  '#BF5AF2',   // purple
  accentSettings: '#636E7B',   // slate

  // ─── Active session — urgent orange (same as brand) ──────────────────────
  active:      '#FF6B35',
  activeDim:   '#E85A28',
  activeMuted: 'rgba(255, 107, 53, 0.18)',
  activePulse: '#FF8C55',

  // ─── Rest state — calm blue ───────────────────────────────────────────────
  rest:      '#0A84FF',
  restDim:   '#0070E0',
  restMuted: 'rgba(10, 132, 255, 0.15)',

  // ─── Success / primary action ─────────────────────────────────────────────
  primary:      '#34C759',   // iOS systemGreen — success, completion, PBs
  primaryDim:   '#28A745',
  primaryMuted: 'rgba(52, 199, 89, 0.15)',

  // ─── Court (warm hardwood + red lines) ───────────────────────────────────
  courtFloor:       '#C8863E',
  courtFloorLight:  '#D9975A',
  courtFloorShadow: '#A86B2A',
  courtLines:       '#CC2200',
  courtWall:        '#F0EDE8',

  // ─── Text ─────────────────────────────────────────────────────────────────
  textPrimary:   '#FFFFFF',
  textSecondary: '#BEBEBE',
  textMuted:     '#9A9A9A',
  textDisabled:  '#2E2E2E',
  textInverse:   '#0A0A0A',

  // ─── Semantic ─────────────────────────────────────────────────────────────
  success: '#34C759',
  warning: '#FFD60A',
  danger:  '#FF453A',
  info:    '#0A84FF',

  // ─── Gamification ─────────────────────────────────────────────────────────
  gold:    '#FFD60A',
  goldDim: '#C9A800',
  silver:  '#ADADAD',
  bronze:  '#C77B30',
  flame:   '#FF4500',

  // ─── Difficulty level colors ──────────────────────────────────────────────
  levelBeginner:     '#34C759',   // green
  levelIntermediate: '#0A84FF',   // blue
  levelAdvanced:     '#FF9F0A',   // amber
  levelElite:        '#FF453A',   // red
  levelPro:          '#BF5AF2',   // purple

  // ─── Borders ──────────────────────────────────────────────────────────────
  border:       'rgba(255, 255, 255, 0.08)',
  borderLight:  'rgba(255, 255, 255, 0.14)',
  borderBrand:  'rgba(255, 107, 53, 0.30)',
  borderActive: '#FF6B35',

  // ─── Overlays ─────────────────────────────────────────────────────────────
  overlay:      'rgba(0, 0, 0, 0.80)',
  overlayLight: 'rgba(0, 0, 0, 0.50)',

  // ─── Tab bar ──────────────────────────────────────────────────────────────
  tabActive:     '#FF6B35',   // brand orange — matches refs
  tabInactive:   '#8A8A8A',   // readable on near-black: ~5.5:1 contrast
  tabBackground: '#0A0A0A',

  // ─── Transparent ──────────────────────────────────────────────────────────
  transparent: 'transparent',
} as const;

export type ColorKey = keyof typeof Colors;
