import { MoonIcon, SunIcon } from "@heroicons/react/24/outline";
import { Link, Outlet } from "react-router-dom";
import { useThemeStore } from "../../stores/themeStore";

export function Layout() {
  const { isDark, toggle } = useThemeStore();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/projects" className="flex items-center gap-2">
              <img src="/logo.png" alt="Bobber VOX" className="h-8 w-8" />
              <span className="text-xl font-bold text-gray-900 dark:text-white">Bobber VOX</span>
            </Link>
            <button
              onClick={toggle}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-all"
              title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDark ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
