import { DarkTheme, type Theme } from 'expo-router';

/** Raw palette for places that can't take a className (SVG, gradients, icons) */
export const palette = {
  ink950: '#06060B',
  ink900: '#0B0B14',
  ink800: '#12121E',
  ink700: '#1A1A29',
  ink600: '#252538',
  ink500: '#34344C',
  mist: '#F4F2FF',
  muted: '#A3A1BF',
  faint: '#64627F',
  violet: '#8B5CF6',
  pink: '#EC4899',
  amber: '#F59E0B',
  mint: '#34D399',
  sky: '#38BDF8',
  coral: '#FB7185',
} as const;

export const brandGradient = [palette.violet, palette.pink, palette.amber] as const;

export const navTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: palette.violet,
    background: palette.ink900,
    card: palette.ink800,
    text: palette.mist,
    border: palette.ink600,
  },
};
