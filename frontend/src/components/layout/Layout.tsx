import { MoonIcon, SunIcon } from "@heroicons/react/24/outline";
import { Link, Outlet } from "react-router-dom";
import { useThemeStore } from "../../stores/themeStore";
import { Sidebar } from "./Sidebar";

export function Layout() {
  const { isDark, toggle } = useThemeStore();

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors relative">
      {/* Gradient background layer */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-indigo-100 via-gray-50 to-purple-100 dark:from-indigo-950/20 dark:via-gray-900 dark:to-purple-950/20 pointer-events-none" />

      <header className="flex-shrink-0 bg-white/50 dark:bg-white/5 backdrop-blur-xl border-b border-white/50 dark:border-white/10 relative z-10">
        <div className="px-4 sm:px-6 lg:px-8">
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

      <div className="flex flex-1 overflow-hidden relative z-10">
        <Sidebar />
        <main className="flex-1 p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
