/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        billiard: {
          dark: '#0a1017',
          surface: '#121a24',
          card: '#182433',
          border: '#223247',
          felt: '#15803d',
          gold: '#f59e0b',
          accent: '#3b82f6',
        }
      }
    },
  },
  plugins: [],
}
