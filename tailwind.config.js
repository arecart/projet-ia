module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './styles/**/*.css'
  ],
  theme: {
    extend: {
      fontFamily: {
        'jetbrains-mono': ['var(--font-jetbrains-mono)'],
        'space-grotesk': ['var(--font-space-grotesk)']
      },
      colors: {
        'neural-dark': '#0a0a1a',
        'cyber-purple': '#8b5cf6',
        'neon-pink': '#ff00ff',
        'hologram-blue': '#00f3ff',
        gray: {
          750: '#2d2d4a',
          900: '#17172b',
        }
      },
      backgroundImage: {
        'cyber-gradient': 'linear-gradient(135deg, #8b5cf6 0%, #ff00ff 50%, #00f3ff 100%)',
        'neural-pattern': "url('/neural-grid.svg')"
      },
      boxShadow: {
        'cyber': '0 0 40px -10px rgba(139, 92, 246, 0.4)',
        'neon': '0 0 30px -5px rgba(255, 0, 255, 0.3)'
      },
      animation: {
        'cyber-pulse': 'cyberPulse 3s ease infinite',
        'neon-border': 'neonBorderFlow 5s linear infinite',
        'hologram': 'hologramFloat 6s ease-in-out infinite'
      },
      keyframes: {
        cyberPulse: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.6 }
        },
        neonBorderFlow: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' }
        },
        hologramFloat: {
          '0%, 100%': { transform: 'translateY(0) rotate(-1deg)' },
          '50%': { transform: 'translateY(-20px) rotate(1deg)' }
        }
      },
      backdropBlur: {
        'cyber': '12px'
      }
    },
    container: {
      center: true,
      padding: '2rem',
      screens: {
        xl: '1280px'
      }
    }
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('tailwind-scrollbar')({ nocompatible: true }),
    require('@tailwindcss/aspect-ratio')
  ]
}