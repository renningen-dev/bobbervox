import { PlusIcon, Squares2X2Icon, TableCellsIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { CreateProjectDialog } from "../components/projects/CreateProjectDialog";
import { ProjectCard } from "../components/projects/ProjectCard";
import { ProjectTable } from "../components/projects/ProjectTable";
import { useProjects } from "../features/projects/api";
import { buttonStyles, cn } from "../lib/styles";

type ViewMode = "grid" | "table";

export function ProjectListPage() {
  const { data: projects, isLoading, error } = useProjects();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem("projectViewMode");
    return (saved === "table" || saved === "grid") ? saved : "grid";
  });

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem("projectViewMode", mode);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 dark:text-gray-400">Loading projects...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500 dark:text-red-400">Failed to load projects</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-medium text-gray-600 dark:text-gray-400">Projects</h1>
        <div className="flex items-center gap-2">
          {/* View Switcher */}
          <div className="flex items-center bg-white/50 dark:bg-white/5 backdrop-blur-xl rounded-lg p-1 border border-white/50 dark:border-white/10">
            <button
              onClick={() => handleViewModeChange("grid")}
              className={cn(
                "p-1.5 rounded-md transition-colors",
                viewMode === "grid"
                  ? "bg-white/80 dark:bg-white/10 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              )}
              title="Grid view"
            >
              <Squares2X2Icon className="w-5 h-5" />
            </button>
            <button
              onClick={() => handleViewModeChange("table")}
              className={cn(
                "p-1.5 rounded-md transition-colors",
                viewMode === "table"
                  ? "bg-white/80 dark:bg-white/10 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              )}
              title="Table view"
            >
              <TableCellsIcon className="w-5 h-5" />
            </button>
          </div>
          <button
            onClick={() => setIsCreateOpen(true)}
            className={cn(buttonStyles.base, buttonStyles.primary)}
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            New Project
          </button>
        </div>
      </div>

      {projects?.length === 0 ? (
        <div className="p-12 text-center rounded-xl bg-white/50 dark:bg-white/5 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-lg shadow-black/5 dark:shadow-none">
          <p className="text-gray-500 dark:text-gray-400 mb-4">No projects yet</p>
          <button
            onClick={() => setIsCreateOpen(true)}
            className={cn(buttonStyles.base, buttonStyles.primary)}
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Create your first project
          </button>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects?.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <ProjectTable projects={projects ?? []} />
      )}

      <CreateProjectDialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />
    </div>
  );
}
