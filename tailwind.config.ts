import type { Config } from 'tailwindcss';

/**
 * Naqsha design tokens — ported verbatim from naqsha-mockups.html :root.
 * Mirror of src/styles/tokens.css. This is the single source of truth for
 * colors, fonts, and radii. Never inline hex in components.
 */
const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#0F1620',
          2: '#1A1F2A',
          3: '#232935',
        },
        paper: {
          DEFAULT: '#F7F4EC',
          2: '#FBF9F3',
          3: '#EFEAD9',
          4: '#E6DFCC',
        },
        teal: {
          DEFAULT: '#124C5A',
          2: '#1B6674',
          3: '#E8F1F2',
        },
        saffron: {
          DEFAULT: '#DFA02B',
          2: '#F5D888',
        },
        success: {
          DEFAULT: '#2E7D5B',
          2: '#DFEEE4',
        },
        alert: {
          DEFAULT: '#B8362B',
          2: '#F5DAD5',
        },
        amber: {
          DEFAULT: '#C2620F',
          2: '#F7E4C7',
        },
        muted: {
          DEFAULT: '#736C60',
          2: '#A69E90',
        },
        line: {
          DEFAULT: '#D8D1C0',
          2: '#C4BCA9',
          strong: '#A69E90',
        },
        // Station accents used in KDS + aggregate
        'station-drinks': '#4EA5B4',
        'station-main': '#C2620F',
        'station-bbq': '#B8362B',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
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
