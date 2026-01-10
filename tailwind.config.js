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
        // IJsvogel kleurenpalet
        kingfisher: {
          50: '#f0f7fa',
          100: '#d9eef5',
          200: '#b3dcea',
          300: '#7cc4db',
          400: '#3ea5c5',
          500: '#1a4a6e',
          600: '#153d5b',
          700: '#0a2540',
          800: '#081c30',
          900: '#051220',
          950: '#030a12',
        },
        amber: {
          50: '#fef8f0',
          100: '#fcefd9',
          200: '#f9dbb3',
          300: '#f4c082',
          400: '#e89f4d',
          500: '#c77a3a',
          600: '#a65f2d',
          700: '#864825',
          800: '#6d3a20',
          900: '#5a301c',
          950: '#33190d',
        },
        teal: {
          50: '#effcf9',
          100: '#c8f7ed',
          200: '#91efdc',
          300: '#52e0c8',
          400: '#26c9af',
          500: '#26a69a',
          600: '#1a857c',
          700: '#196a64',
          800: '#185451',
          900: '#184644',
          950: '#082928',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
