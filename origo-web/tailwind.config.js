/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0D0D14',
        primary: '#6C3DFF',
        'primary-light': '#8B5CF6',
        accent: '#FF6B9D',
        amber: '#F59E0B',
        green: '#10B981',
        card: '#1A1A2E',
        muted: '#16213E',
        border: '#2A2A45',
        'text-primary': '#FFFFFF',
        'text-secondary': '#B0B0CC',
        'text-muted': '#6B6B8A',
      },
      fontFamily: {
        poppins: ['Poppins', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'gradient-shift': 'gradientShift 8s ease infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(108,61,255,0.4)' },
          '50%': { boxShadow: '0 0 40px rgba(108,61,255,0.8)' },
        },
        gradientShift: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
      },
    },
  },
  plugins: [],
};
