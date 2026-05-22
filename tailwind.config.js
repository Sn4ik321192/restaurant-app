/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink: '#080706',
        charcoal: '#14110e',
        coffee: '#2a211a',
        gold: '#d8b35f',
        cream: '#f3e7d0',
      },
      boxShadow: {
        glow: '0 18px 60px rgba(216, 179, 95, 0.16)',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slowZoom: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.08)' },
        },
        floatSoft: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-120%) skewX(-18deg)' },
          '100%': { transform: 'translateX(220%) skewX(-18deg)' },
        },
        pulseGold: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(216, 179, 95, 0.28)' },
          '50%': { boxShadow: '0 0 0 12px rgba(216, 179, 95, 0)' },
        },
      },
      animation: {
        fadeUp: 'fadeUp 0.72s ease both',
        slowZoom: 'slowZoom 16s ease-in-out infinite',
        floatSoft: 'floatSoft 5.5s ease-in-out infinite',
        shimmer: 'shimmer 2.4s ease-in-out infinite',
        pulseGold: 'pulseGold 2.8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
