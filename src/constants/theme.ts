export const Spacing = {
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
};

export const Radii = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 28,
  pill: 999,
};

// DailyLoop-style light monochrome palette: near-white canvas, white cards,
// black text/CTAs, soft gray secondary text. Category/status colors stay as
// muted accents used only for small dots, chips and icons.
export const Colors = {
  light: {
    background: '#F6F6F4',
    surface: '#FFFFFF',
    surfaceMuted: '#F1F1EF',
    border: '#ECECE9',
    text: '#14161A',
    textSecondary: '#8A8F98',
    primary: '#14161A',
    onPrimary: '#FFFFFF',
    success: '#059669',
    warning: '#D97706',
    error: '#DC2626',
  },
  dark: {
    background: '#F6F6F4',
    surface: '#FFFFFF',
    surfaceMuted: '#F1F1EF',
    border: '#ECECE9',
    text: '#14161A',
    textSecondary: '#8A8F98',
    primary: '#14161A',
    onPrimary: '#FFFFFF',
    success: '#059669',
    warning: '#D97706',
    error: '#DC2626',
  },
};

export const Shadow = {
  card: {
    shadowColor: '#14161A',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  floating: {
    shadowColor: '#14161A',
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
};

export const Typography = {
  small: { fontSize: 12, lineHeight: 16 },
  smallBold: { fontSize: 12, lineHeight: 16, fontWeight: '600' as const },
  body: { fontSize: 14, lineHeight: 20 },
  bodyBold: { fontSize: 14, lineHeight: 20, fontWeight: '600' as const },
  title: { fontSize: 18, lineHeight: 24, fontWeight: '700' as const },
  heading: { fontSize: 26, lineHeight: 32, fontWeight: '800' as const },
};
