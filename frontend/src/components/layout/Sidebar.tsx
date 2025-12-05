import {
  ArrowRightOnRectangleIcon,
  ChevronDownIcon,
  Cog6ToothIcon,
  FolderIcon,
  MicrophoneIcon,
} from "@heroicons/react/24/outline";
import { Disclosure, DisclosureButton, DisclosurePanel } from "@headlessui/react";
import { signOut } from "firebase/auth";
import { NavLink, useNavigate } from "react-router-dom";
import { useProjects } from "../../features/projects/api";
import { auth } from "../../lib/firebase";
import { cn } from "../../lib/styles";
import { useAuthStore } from "../../stores/authStore";

const navLinkStyles = {
  base: "flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors",
  active: "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300",
  inactive: "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5",
};

export function Sidebar() {
  const { data: projects } = useProjects();
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut(auth);
    clearAuth();
    navigate("/login");
  };

  return (
    <aside className="w-64 flex-shrink-0 border-r border-white/50 dark:border-white/10 bg-white/50 dark:bg-white/5 backdrop-blur-xl overflow-y-auto flex flex-col">
      <nav className="p-4 space-y-2 flex-1">
        <Disclosure defaultOpen>
          {({ open }) => (
            <>
              <DisclosureButton className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
                <span className="flex items-center gap-2">
                  <FolderIcon className="w-5 h-5" />
                  Projects
                </span>
                <ChevronDownIcon
                  className={cn(
                    "w-4 h-4 transition-transform duration-200",
                    open && "rotate-180"
                  )}
                />
              </DisclosureButton>
              <DisclosurePanel className="mt-1 ml-4 space-y-1">
                <NavLink
                  to="/projects"
                  end
                  className={({ isActive }) =>
                    cn(navLinkStyles.base, isActive ? navLinkStyles.active : navLinkStyles.inactive)
                  }
                >
                  All Projects
                </NavLink>
                {projects?.map((project) => (
                  <NavLink
                    key={project.id}
                    to={`/projects/${project.id}`}
                    className={({ isActive }) =>
                      cn(
                        navLinkStyles.base,
                        "truncate",
                        isActive ? navLinkStyles.active : navLinkStyles.inactive
                      )
                    }
                    title={project.name}
                  >
                    {project.name}
                  </NavLink>
                ))}
              </DisclosurePanel>
            </>
          )}
        </Disclosure>

        <NavLink
          to="/voices"
          className={({ isActive }) =>
            cn(navLinkStyles.base, isActive ? navLinkStyles.active : navLinkStyles.inactive)
          }
        >
          <MicrophoneIcon className="w-5 h-5" />
          Custom Voices
        </NavLink>

        <NavLink
          to="/settings"
          className={({ isActive }) =>
            cn(navLinkStyles.base, isActive ? navLinkStyles.active : navLinkStyles.inactive)
          }
        >
          <Cog6ToothIcon className="w-5 h-5" />
          Settings
        </NavLink>
      </nav>

      {/* User section */}
      {user && (
        <div className="p-4 border-t border-white/50 dark:border-white/10">
          <div className="flex items-center gap-3">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || "User"}
                className="w-8 h-8 rounded-full"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white text-sm font-medium">
                {(user.displayName || user.email || "U")[0].toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {user.displayName || "User"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {user.email}
              </p>
            </div>
            <button
              onClick={handleSignOut}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
              title="Sign out"
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
