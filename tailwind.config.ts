import type { Config } from 'tailwindcss';

/**
 * Naqsha design tokens — "warm hospitality" palette.
 * Mirror of src/styles/tokens.css. This is the single source of truth for
 * colors, fonts, and radii. Never inline hex in components.
 */
const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Warm charcoal — surfaces + text (no blue cast).
        ink: {
          DEFAULT: '#221E1A',
          2: '#2C2822',
          3: '#3A342C',
        },
        // Warm off-white paper — page + cards.
        paper: {
          DEFAULT: '#F7F3EC',
          2: '#FDFBF6',
          3: '#EEE7DA',
          4: '#E2D8C7',
        },
        // Deep herb green — primary accent.
        teal: {
          DEFAULT: '#25604A',
          2: '#357A5E',
          3: '#E5EFE9',
        },
        // Earthy terracotta/amber — secondary accent.
        saffron: {
          DEFAULT: '#C77D33',
          2: '#ECC891',
        },
        success: {
          DEFAULT: '#2E7D5B',
          2: '#DCECE2',
        },
        alert: {
          DEFAULT: '#B23A2E',
          2: '#F1DBD6',
        },
        amber: {
          DEFAULT: '#B96A16',
          2: '#F2E1C7',
        },
        muted: {
          DEFAULT: '#7C7267',
          2: '#A99E8E',
        },
        line: {
          DEFAULT: '#E4DBCC',
          2: '#D3C8B5',
          strong: '#B9AC96',
        },
        // Station accents used in KDS + aggregate
        'station-drinks': '#3E8E7E',
        'station-main': '#B96A16',
        'station-bbq': '#B23A2E',
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        // Disciplined 4-8px scale — nothing SaaS-generic (handover §4).
        sm: '3px',
        DEFAULT: '4px',
        md: '6px',
        lg: '8px',
      },
      letterSpacing: {
        ref: '0.06em',
        code: '0.1em',
      },
      keyframes: {
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
      },
      animation: {
        pulse: 'pulse 1.5s infinite',
      },
    },
  },
  plugins: [],
};

export default config;
