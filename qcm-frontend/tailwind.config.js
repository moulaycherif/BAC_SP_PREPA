/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // 👈 important pour scanner tous tes composants
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
