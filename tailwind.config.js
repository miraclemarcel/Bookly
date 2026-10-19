/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#06060B',
          900: '#0B0B14',
          800: '#12121E',
          700: '#1A1A29',
          600: '#252538',
          500: '#34344C',
        },
        mist: {
          DEFAULT: '#F4F2FF',
          muted: '#A3A1BF',
          faint: '#64627F',
        },
        violet: '#8B5CF6',
        pink: '#EC4899',
        amber: '#F59E0B',
        mint: '#34D399',
        sky: '#38BDF8',
        coral: '#FB7185',
      },
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
};
