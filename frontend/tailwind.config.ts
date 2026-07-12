import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#F4F1E8',
        surface: '#E8E2D0',
        line: '#CDD2C9',
        ink: '#2D3A1F',
        accent: '#B8A678',
        white: '#E8E2D0',
        primary: {
          DEFAULT: '#2D3A1F',
          dark: '#202B15',
          light: '#53643B',
          50: '#F4F1E8',
          100: '#E8E2D0',
          200: '#CDD2C9',
          300: '#B8A678',
          400: '#697953',
          500: '#3D4B2B',
          600: '#2D3A1F',
          700: '#243017',
          800: '#202B15',
          900: '#18200F',
        },
        gray: {
          50: '#F4F1E8',
          100: '#E8E2D0',
          200: '#CDD2C9',
          300: '#B8A678',
          400: '#8D967F',
          500: '#69745D',
          600: '#526047',
          700: '#414D35',
          800: '#36442A',
          900: '#2D3A1F',
          950: '#202B15',
        },
        slate: {
          50: '#F4F1E8',
          100: '#E8E2D0',
          200: '#CDD2C9',
          300: '#B8A678',
          400: '#8D967F',
          500: '#69745D',
          600: '#526047',
          700: '#414D35',
          800: '#36442A',
          900: '#2D3A1F',
          950: '#202B15',
        },
        stadium: {
          normal: '#22c55e',
          busy: '#f59e0b',
          congested: '#ef4444',
          closed: '#6b7280',
        },
        fifa: {
          gold: '#d4af37',
          dark: '#1a1a2e',
          accent: '#16213e',
        },
      },
      fontFamily: {
        sans: ['Sora', 'system-ui', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(45, 58, 31, 0.18)' },
          '100%': { boxShadow: '0 0 20px rgba(45, 58, 31, 0.32)' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
