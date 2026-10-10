/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        studio: {
          50: '#faf8f5',
          100: '#f5f0e6',
          200: '#eadecb',
          300: '#d9c8af',
          400: '#bda686',
          500: '#9c8362',
          600: '#7d6647',
          700: '#5f4c33',
          800: '#423422',
          900: '#261d12',
          950: '#17110a',
        },
        warm: {
          50: '#fdfcf9',
          100: '#f9f6f0',
          200: '#f3ede2',
          300: '#e6dbca',
          400: '#cbb79c',
          500: '#ab9373',
          600: '#8a7153',
          700: '#6c563e',
          800: '#4c3b2a',
          900: '#2d2217',
        },
        gold: {
          400: '#fbbf24',
          500: '#d97706',
          600: '#b45309',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
      }
    },
  },
  plugins: [],
}
