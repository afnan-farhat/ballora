/** @type {import('tailwindcss').Config} */
import postcss from '@tailwindcss/postcss';
import autoprefixer from 'autoprefixer';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      screens: {
        tablet: '640px',
        // => @media (min-width: 640px) { ... }

        laptop: '1024px',
        // => @media (min-width: 1024px) { ... }

        desktop: '1280px',
        // => @media (min-width: 1280px) { ... }
      },

      colors: {
        solnBlue: '#063D58',
      },

      fontFamily: {
        sans: ['Tajawal', 'sans-serif'],
        display: ['Tajawal', 'sans-serif'],
        body: ['Tajawal', 'sans-serif'],
        amiri: ['Amiri', 'serif'],
      },

      keyframes: {
        marquee: {
          '0%': {
            transform: 'translateX(170%)'
          },
          '100%': {
            transform: 'translateX(-100%)'
          },
        },
        'fade-in': {
          // ← the name “fade-in” is arbitrary
          '0%': {
            opacity: 0,
            transform: 'scale(0.95)'
          },
          '100%': {
            opacity: 1,
            transform: 'scale(1)'
          },
        },
        'fade-out': {
          '0%': {
            opacity: 1,
            transform: 'scale(1)'
          },
          '100%': {
            opacity: 0,
            transform: 'scale(0.95)'
          },
        },
      },
      animation: {
        marquee: 'marquee 15s linear infinite',
        'fade-in': 'fade-in 0.8s ease-out forwards',
        'fade-out': 'fade-out 0.5s ease-in forwards',
      },
    },
  },
  plugins: [postcss, autoprefixer],
};