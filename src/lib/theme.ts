import { DefaultTheme, type Theme } from 'expo-router';

/** Raw palette for places that can't take a className (SVG, icons, dynamic styles) */
export const palette = {
  canvas: '#FFFFFF',
  surface: '#F6F6F8',
  surface2: '#EEEEF2',
  surface3: '#E2E2E8',
  line: '#E7E7EC',
  lineStrong: '#D1D1DA',
  ink: '#111118',
  inkMuted: '#4B4B5C',
  inkFaint: '#7A7A8C',
  violet: '#6D28D9',
  pink: '#DB2777',
  amber: '#B45309',
  mint: '#047857',
  sky: '#0369A1',
  coral: '#DC2626',
} as const;

/** Primary brand colour, used for buttons, the FAB and selection states */
export const brand = palette.violet;

/** Append a hex alpha (00–FF) to a #RRGGBB colour */
export const tint = (hex: string, alpha: string) => hex + alpha;

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
