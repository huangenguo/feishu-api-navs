/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
  corePlugins: {
    scrollbar: false,
  },
  variants: {
    scrollbar: ['rounded']
  },
  extend: {
    utilities: {
      '.scrollbar-none': {
        '-ms-overflow-style': 'none',
        'scrollbar-width': 'none',
        '&::-webkit-scrollbar': {
          display: 'none'
        }
      }
    }
  }
} 