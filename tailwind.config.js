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
          50: 'var(--color-garden-50)',
          100: 'var(--color-garden-100)',
          200: 'var(--color-garden-200)',
          300: 'var(--color-garden-300)',
          400: 'var(--color-garden-400)',
          500: 'var(--color-garden-500)',
          600: 'var(--color-garden-600)',
          700: 'var(--color-garden-700)',
          800: 'var(--color-garden-800)',
          900: 'var(--color-garden-900)',
          950: 'var(--color-garden-950)',
        },
        // Semantic Theme Extensions
        'bg-primary': 'var(--bg-primary)',
        'bg-secondary': 'var(--bg-secondary)',
        'bg-tertiary': 'var(--bg-tertiary)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'border-primary': 'var(--border-primary)',
      },
    },
  },
  plugins: [],
}
