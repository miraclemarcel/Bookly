/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      // Keep in sync with `palette` in src/lib/theme.ts
      colors: {
        canvas: '#FFFFFF',
        surface: {
          DEFAULT: '#F6F6F8',
          2: '#EEEEF2',
          3: '#E2E2E8',
        },
        line: {
          DEFAULT: '#E7E7EC',
          strong: '#D1D1DA',
        },
        ink: {
          DEFAULT: '#111118',
          muted: '#4B4B5C',
          faint: '#7A7A8C',
        },
        violet: '#6D28D9',
        pink: '#DB2777',
        amber: '#B45309',
        mint: '#047857',
        sky: '#0369A1',
        coral: '#DC2626',
      },
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
};
