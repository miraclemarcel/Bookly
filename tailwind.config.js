/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        canvas: '#FFFFFF',
        surface: {
          DEFAULT: '#F6F5FB',
          2: '#EEECF6',
          3: '#E3E0EE',
        },
        line: {
          DEFAULT: '#ECEAF3',
          strong: '#D4D0E2',
        },
        ink: {
          DEFAULT: '#16141F',
          muted: '#6E6A85',
          faint: '#A6A3B8',
        },
        // Deeper accents so text stays readable on white
        violet: '#7C3AED',
        pink: '#DB2777',
        amber: '#D97706',
        mint: '#059669',
        sky: '#0284C7',
        coral: '#E11D48',
      },
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
};
