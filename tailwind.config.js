/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        garden: {
          50: '#f2fcf5',
          100: '#e1f7e7',
          200: '#c5efd2',
          300: '#98e1b0',
          400: '#64cc85',
          500: '#3fab62',
          600: '#2e894c',
          700: '#276d3f',
          800: '#235634',
          900: '#1f472d',
          950: '#0d2716',
        },
      },
    },
  },
  plugins: [],
}
