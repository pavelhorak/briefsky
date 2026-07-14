const config = {
  content: ['./src/**/*.{html,js,svelte,ts}', './node_modules/flowbite-svelte/**/*.{html,js,svelte,ts}'],

  // Touch devices emulate :hover on tap and it sticks until the next touch, leaving
  // buttons (e.g. the Gate pill) looking pressed — only apply hover: styles on real pointers
  future: {
    hoverOnlyWhenSupported: true,
  },

  theme: {
    screens: {
      sm: '480px',
      md: '768px',
      lg: '976px',
      // Landscape breakpoint: matches typical tablet landscape widths
      'landscape': { raw: '(min-aspect-ratio: 4/3) and (min-width: 976px)' },
    },
    extend: {
      gridTemplateColumns: {
        '6': 'repeat(6, minmax(0, 1fr))',
        '16': 'repeat(16, minmax(0, 1fr))',
      },
      gridTemplateRows: {
        '10': 'repeat(10, minmax(0, 1fr))',
      },
      gridColumnStart: {
        '13': '13',
        '14': '14',
        '15': '15',
        '16': '16',
      },
      gridRowStart: {
        '8': '8',
        '9': '9',
        '10': '10',
      },
      fontFamily: {
        sans: ['"Cantarell"', '"Open Sans"', 'ui-sans-serif', 'system-ui', 'san-serif'],
      },
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
      },
    },
  },

  plugins: [require('flowbite/plugin')],

  darkMode: 'class',
};

module.exports = config;
