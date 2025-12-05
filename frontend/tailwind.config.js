/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    "bg-gray-500",
    "bg-gray-400",
    "bg-red-600",
    "hover:bg-gray-400",
    "hover:bg-red-500",
    "shadow-inner",
    "shadow-white/10",
    "text-white",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
