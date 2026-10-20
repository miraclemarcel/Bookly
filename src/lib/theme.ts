import { DefaultTheme, type Theme } from 'expo-router';

/** Raw palette for places that can't take a className (SVG, gradients, icons) */
export const palette = {
  canvas: '#FFFFFF',
  surface: '#F6F5FB',
  surface2: '#EEECF6',
  surface3: '#E3E0EE',
  line: '#ECEAF3',
  lineStrong: '#D4D0E2',
  ink: '#16141F',
  inkMuted: '#6E6A85',
  inkFaint: '#A6A3B8',
  violet: '#7C3AED',
  pink: '#DB2777',
  amber: '#D97706',
  mint: '#059669',
  sky: '#0284C7',
  coral: '#E11D48',
} as const;

/** Vivid brand colours, used for gradients and decoration rather than text */
export const brand = {
  violet: '#8B5CF6',
  pink: '#EC4899',
  amber: '#F59E0B',
} as const;

export const brandGradient = [brand.violet, brand.pink, brand.amber] as const;

export const navTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: palette.violet,
    background: palette.canvas,
    card: palette.canvas,
    text: palette.ink,
    border: palette.line,
  },
};
