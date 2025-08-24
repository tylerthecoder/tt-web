const colors = require('tailwindcss/colors');

module.exports = {
  content: ['./app/**/*.{ts,tsx}', './pages/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      zIndex: {
        '-1': '-1',
      },
      colors: {
        vibage: '#f97316',
        vibageDark: '#ea580c',
        terminal: '#41FF00',
      },
      fontFamily: {
        terminal: ['VT323'],
      },
    },
  },
  variants: {
    extend: {
      backgroundColor: ['responsive', 'hover', 'focus', 'active'],
      borderColor: ['responsive', 'hover', 'focus', 'active'],
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
