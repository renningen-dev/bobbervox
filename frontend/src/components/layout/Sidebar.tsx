import {
  ChevronDownIcon,
  Cog6ToothIcon,
  FolderIcon,
} from "@heroicons/react/24/outline";
import { Disclosure, DisclosureButton, DisclosurePanel } from "@headlessui/react";
import { NavLink } from "react-router-dom";
import { useProjects } from "../../features/projects/api";
import { cn } from "../../lib/styles";

const navLinkStyles = {
  base: "flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors",
  active: "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300",
  inactive: "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5",
};

export function Sidebar() {
  const { data: projects } = useProjects();

  return (
    <aside className="w-64 flex-shrink-0 border-r border-white/50 dark:border-white/10 bg-white/50 dark:bg-white/5 backdrop-blur-xl overflow-y-auto">
      <nav className="p-4 space-y-2">
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
          to="/settings"
          className={({ isActive }) =>
            cn(navLinkStyles.base, isActive ? navLinkStyles.active : navLinkStyles.inactive)
          }
        >
          <Cog6ToothIcon className="w-5 h-5" />
          Settings
        </NavLink>
      </nav>
    </aside>
  );
}
