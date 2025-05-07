/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#3B82F6',
          dark: '#2563EB',
          light: '#93C5FD'
        },
        secondary: {
          DEFAULT: '#8B5CF6',
          dark: '#7C3AED',
          light: '#A78BFA'
        },
        accent: {
          DEFAULT: '#EC4899',
          dark: '#DB2777',
          light: '#F472B6'
        },
        dark: {
          DEFAULT: '#1E293B',
          light: '#334155'
        },
        light: {
          DEFAULT: '#F8FAFC',
          dark: '#F1F5F9'
        },
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        muted: '#94A3B8'
      },
      fontFamily: {
        sans: ['"Poppins"', 'sans-serif'],
        display: ['"Montserrat"', 'sans-serif']
      },
      boxShadow: {
        'soft': '0 4px 24px rgba(0, 0, 0, 0.08)',
        'hard': '0 8px 32px rgba(0, 0, 0, 0.12)',
        'inner': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)'
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('tailwindcss-animate')
  ],
}