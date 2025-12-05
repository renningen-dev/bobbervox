export const buttonStyles = {
  base: "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all",
  primary: "bg-purple-500 hover:bg-purple-400 dark:bg-purple-700 dark:hover:bg-purple-600 text-white shadow-md shadow-purple-500/20",
  secondary: "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600",
  danger: "bg-red-600 text-white hover:bg-red-500",
};

export const inputStyles = {
  base: "block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-800 dark:border-0 dark:outline dark:outline-white/10 dark:text-white dark:placeholder-gray-500 dark:focus:outline-indigo-500",
};

export const selectStyles = {
  base: "block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-800 dark:border-0 dark:outline dark:outline-white/10 dark:text-white cursor-pointer",
};

export const cardStyles = {
  base: "bg-white rounded-xl shadow-sm border border-gray-200 dark:bg-gray-800 dark:border-0 dark:outline dark:outline-white/15",
};

export function cn(...classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(" ");
}
