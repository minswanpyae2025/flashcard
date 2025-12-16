/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: '#0070BA', // Medical/Tech Blue from logo
          cyan: '#2CA6E0', // Lighter gradient tone
          gold: '#FBBF24', // Accent gold/yellow
          dark: '#111827', // Text
        }
      }
    },
  },
  plugins: [],
}
