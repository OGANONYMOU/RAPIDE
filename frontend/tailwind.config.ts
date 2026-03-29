import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eefdf9',
          100: '#d7faf1',
          200: '#aff2e3',
          300: '#74e4cf',
          400: '#35cbb3',
          500: '#149a85',
          600: '#0f7f6f',
          700: '#11665a',
          800: '#124f47',
          900: '#123f39',
          950: '#062723',
        },
        surface: {
          50: '#f6f8fb',
          100: '#edf2f7',
          200: '#dbe3ee',
          300: '#c2cede',
          400: '#8ea0b8',
          500: '#5f7189',
          600: '#43536a',
          700: '#314055',
          800: '#1d293d',
          900: '#111827',
          950: '#0b1120',
        },
        success: { light: '#dcfce7', DEFAULT: '#22c55e', dark: '#15803d' },
        warning: { light: '#fef9c3', DEFAULT: '#eab308', dark: '#a16207' },
        danger: { light: '#fee2e2', DEFAULT: '#ef4444', dark: '#b91c1c' },
        info: { light: '#dbeafe', DEFAULT: '#3b82f6', dark: '#1d4ed8' },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.75rem' }],
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        card: '0 10px 30px -18px rgb(15 23 42 / 0.16), 0 4px 10px -6px rgb(15 23 42 / 0.08)',
        'card-md': '0 18px 40px -20px rgb(15 23 42 / 0.18), 0 10px 18px -12px rgb(15 23 42 / 0.10)',
        'card-lg': '0 28px 60px -28px rgb(15 23 42 / 0.22), 0 14px 30px -18px rgb(15 23 42 / 0.12)',
        glow: '0 0 0 3px rgb(20 154 133 / 0.2)',
      },
      keyframes: {
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'pulse-ring': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgb(20 154 133 / 0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgb(20 154 133 / 0)' },
        },
      },
      animation: {
        'slide-up': 'slide-up 0.25s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
        'pulse-ring': 'pulse-ring 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
