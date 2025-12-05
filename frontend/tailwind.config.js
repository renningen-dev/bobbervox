/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    // Primary button colors
    "bg-purple-700",
    "hover:bg-purple-600",
    "shadow-purple-500/20",
    // Secondary button colors
    "bg-gray-200",
    "bg-gray-700",
    "hover:bg-gray-300",
    "hover:bg-gray-600",
    "dark:bg-gray-700",
    "dark:hover:bg-gray-600",
    "dark:text-gray-200",
    // Legacy
    "bg-gray-500",
    "bg-gray-400",
    "bg-red-600",
    "hover:bg-gray-400",
    "hover:bg-red-500",
    "shadow-inner",
    "shadow-white/10",
    "text-white",
    // Transitions
    "transition",
    "transition-all",
    "transition-opacity",
    "transition-transform",
    "duration-150",
    "duration-200",
    "duration-1000",
    "ease-out",
    "origin-top",
    // Data-closed variants for HeadlessUI
    "data-[closed]:opacity-0",
    "data-[closed]:scale-95",
    "data-[closed]:-translate-y-2",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
