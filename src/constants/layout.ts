export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
  huge: 64,
} as const;

export const FontSize = {
  positionDisplay: 72,   // readable while sprinting — the active position call
  countdownDisplay: 96,  // 3-2-1 countdown
  roundCounter: 48,
  hero: 36,
  title: 24,
  sectionHeader: 20,
  body: 16,
  label: 14,
  caption: 12,
  micro: 10,
} as const;

export const FontWeight = {
  black: '900' as const,
  extraBold: '800' as const,
  bold: '700' as const,
  semiBold: '600' as const,
  medium: '500' as const,
  regular: '400' as const,
  light: '300' as const,
};

export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  full: 9999,
} as const;

export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.35,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 5,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.55,
    shadowRadius: 16,
    elevation: 10,
  },
  glow: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  }),
} as const;

export const ButtonHeight = {
  sm: 36,
  md: 48,
  lg: 56,
  xl: 64,   // Primary CTA — START GHOSTING
} as const;

export const IconSize = {
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
  tab: 24,
} as const;

// WSF court aspect ratio for SVG scaling
export const COURT_ASPECT_RATIO = 9.75 / 6.40; // ≈ 1.523
