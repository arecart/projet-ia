/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './styles/**/*.css',
  ],
  theme: {
    extend: {
      fontFamily: {
        'jetbrains-mono': ['var(--font-jetbrains-mono)', 'monospace'], // Ajout d'un fallback
      },
      colors: {
        gray: {
          750: '#2d2d2d',
          900: '#171717',
        },
        'deep-purple': {
          900: '#1a1a2e',
          800: '#2a2a4a',
        },
        // Ajout de couleurs pour les messages et boutons (ex. pour chat)
        purple: {
          600: '#9333ea', // Pour les messages utilisateur
          700: '#7e22ce', // Hover pour boutons
        },
        blue: {
          600: '#2563eb', // Pour boutons "Afficher les anciens messages"
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'glass-effect': 'linear-gradient(145deg, rgba(39, 39, 68, 0.8) 0%, rgba(74, 58, 95, 0.8) 100%)',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glow': '0 0 20px rgba(139, 92, 246, 0.3)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'fade-in-up': 'fadeInUp 0.5s ease-out',
        'gradient-flow': 'gradientBG 15s ease infinite',
        'border-flow': 'borderFlow 3s linear infinite',
        'float': 'float 3s ease-in-out infinite',
        'spin': 'spin 1s linear infinite',
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite', // Déjà présent, confirmé
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        fadeInUp: {
          '0%': { opacity: 0, transform: 'translateY(20px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        gradientBG: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        borderFlow: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        pulse: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.5 },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      // Ajout de classes pour les scrollbars personnalisées (déjà utilisé dans votre code)
      scrollbar: {
        thin: 'thin',
        thumb: {
          'gray-700': 'rgba(55, 65, 81, 0.7)',
        },
      },
    },
    container: {
      center: true,
      padding: '1.5rem',
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('tailwind-scrollbar'), // Assurez-vous que ce plugin est installé
  ],
};