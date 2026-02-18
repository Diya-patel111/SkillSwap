/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/**/*.{html,ts}',
  ],
  theme: {
    extend: {
      colors: {
        // CSS-variable-driven tokens — support Tailwind opacity modifiers (e.g. bg-primary/50)
        'primary':          'rgb(var(--color-primary) / <alpha-value>)',
        'surface':          'rgb(var(--color-surface) / <alpha-value>)',
        'surface-2':        'rgb(var(--color-surface-2) / <alpha-value>)',
        'theme-border':     'rgb(var(--color-border) / <alpha-value>)',
        'theme-text':       'rgb(var(--color-text) / <alpha-value>)',
        'theme-muted':      'rgb(var(--color-text-muted) / <alpha-value>)',
        'background-light': '#f6f7f8',
        'background-dark':  '#121820',
      },
      fontFamily: {
        display: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.5rem',
        lg: '1rem',
        xl: '1.5rem',
        full: '9999px',
      },
    },
  },
  plugins: [],
};

