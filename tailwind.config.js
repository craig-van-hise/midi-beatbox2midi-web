/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'hit-cyan': '#00f2ff',
        'hit-blue': '#0066ff',
        'hit-gray': '#94a3b8',
      }
    },
  },
  plugins: [],
}
