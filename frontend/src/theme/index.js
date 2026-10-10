import { DefaultTheme } from '@react-navigation/native';

/**
 * SwimLogix design tokens - premium aquatic palette.
 * Deep aquatic blues, crisp white cards, gold/amber accent gradients.
 */
export const colors = {
  primary: '#004E64',
  primaryDark: '#00323F',
  primaryLight: '#0A6E88',
  accent: '#2563EB',
  accentLight: '#60A5FA',
  gold: '#F5B301',
  goldDark: '#C98A00',
  amber: '#FBBF24',

  bg: '#F4F7FB',
  bgDark: '#E8EFF6',
  card: '#FFFFFF',

  text: '#0B1F2A',
  textMuted: '#5B7383',
  textOnPrimary: '#FFFFFF',

  border: '#E2E9F0',
  borderStrong: '#CBD8E4',

  success: '#16A34A',
  danger: '#DC2626',
  warning: '#D97706',
  info: '#2563EB',

  overlay: 'rgba(0, 30, 45, 0.55)',
};

export const gradients = {
  primary: ['#004E64', '#0A6E88'],
  gold: ['#F5B301', '#FBBF24'],
  hero: ['#00323F', '#004E64', '#2563EB'],
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

export const radius = { sm: 8, md: 12, lg: 18, xl: 24, pill: 999 };

export const typography = {
  h1: { fontSize: 28, fontWeight: '800', letterSpacing: -0.4, color: colors.text },
  h2: { fontSize: 22, fontWeight: '800', letterSpacing: -0.2, color: colors.text },
  h3: { fontSize: 18, fontWeight: '700', color: colors.text },
  title: { fontSize: 16, fontWeight: '700', color: colors.text },
  body: { fontSize: 15, fontWeight: '500', color: colors.text },
  bodyMuted: { fontSize: 15, fontWeight: '500', color: colors.textMuted },
  small: { fontSize: 13, fontWeight: '500', color: colors.textMuted },
  caption: { fontSize: 11, fontWeight: '600', color: colors.textMuted, letterSpacing: 0.6 },
  button: { fontSize: 16, fontWeight: '700', letterSpacing: 0.2 },
};

/** Soft elevation used on cards and floating surfaces (iOS shadow + Android elevation). */
export const shadow = {
  card: {
    shadowColor: '#00323F',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
  },
  raised: {
    shadowColor: '#00323F',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 8,
  },
};

export const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    background: colors.bg,
    card: colors.card,
    text: colors.text,
    border: colors.border,
    notification: colors.gold,
  },
};

export default { colors, gradients, spacing, radius, typography, shadow, navigationTheme };
