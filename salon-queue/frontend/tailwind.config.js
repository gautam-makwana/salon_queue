/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        white: '#FFFFFF',
        pista: {
          DEFAULT: '#C1D9A5', // Primary accent
          light: '#EDF5E5',   // Highlighted sections
          dark: '#A8C988',
          border: '#D7E7C5',
        },
        softblack: {
          DEFAULT: '#171717', // Primary text
          secondary: '#404040',
          muted: '#737373',
          border: '#E5E5E5',
        },
        offwhite: {
          DEFAULT: '#F8F9F5', // Secondary background
          subtle: '#F0F2EA',
          card: '#FCFCFA',
        },
        deepgreen: {
          DEFAULT: '#547A43', // Accent text and active states
          hover: '#436335',
          light: '#659351',
          bg: '#EAF3E4',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Manrope', 'system-ui', 'sans-serif'],
        display: ['Manrope', '"Plus Jakarta Sans"', 'sans-serif'],
      },
      borderRadius: {
        'xl': '14px',
        '2xl': '18px',
        '3xl': '24px',
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
        'card': '0 4px 20px -2px rgba(23, 23, 23, 0.05)',
        'float': '0 10px 30px -5px rgba(23, 23, 23, 0.08), 0 4px 6px -2px rgba(23, 23, 23, 0.03)',
      },
      minHeight: {
        touch: '44px',
      },
      minWidth: {
        touch: '44px',
      },
    },
  },
  plugins: [],
};
