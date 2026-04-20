/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        accent: '#FF6B35',
        navy: '#1A1A2E',
        cream: '#F8F6F0',
        ink: '#22223B',
        muted: '#666666',
        danger: '#E53935',
        success: '#2E7D32',
        gold: '#D9A441',
      },
      boxShadow: {
        card: '0 2px 16px rgba(0,0,0,0.07)',
      },
      borderRadius: {
        xl: '16px',
        '2xl': '20px',
      },
      animation: {
        pulseBorder: 'pulseBorder 1.8s ease-in-out infinite',
      },
      keyframes: {
        pulseBorder: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(229, 57, 53, 0.15)' },
          '50%': { boxShadow: '0 0 0 8px rgba(229, 57, 53, 0)' },
        },
      },
    },
  },
  plugins: [],
};

