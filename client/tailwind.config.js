/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'dark-bg': '#0f0f23',
        'dark-surface': '#1a1a3e',
        'dark-card': '#25254a',
        'neon-pink': '#ff2d78',
        'neon-cyan': '#00f0ff',
        'neon-yellow': '#ffd700',
        'neon-green': '#39ff14',
      },
      fontFamily: {
        zen: ['"Zen Maru Gothic"', 'sans-serif'],
        orbitron: ['"Orbitron"', 'sans-serif'],
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'shake': 'shake 0.5s ease-in-out',
        'zoom-fade': 'zoomFade 0.8s ease-out forwards',
        'bar-bounce': 'barBounce 0.5s ease-in-out infinite alternate',
        'slide-up': 'slideUp 0.4s ease-out',
        'ripple': 'ripple 0.6s ease-out',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(255, 45, 120, 0.5)' },
          '50%': { boxShadow: '0 0 40px rgba(255, 45, 120, 0.8), 0 0 80px rgba(255, 45, 120, 0.3)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-4px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(4px)' },
        },
        zoomFade: {
          '0%': { transform: 'scale(0.5)', opacity: '1' },
          '100%': { transform: 'scale(2)', opacity: '0' },
        },
        barBounce: {
          '0%': { height: '10%' },
          '100%': { height: '100%' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        ripple: {
          '0%': { transform: 'scale(0)', opacity: '1' },
          '100%': { transform: 'scale(4)', opacity: '0' },
        },
      },
    },
  },
  plugins: [],
};
