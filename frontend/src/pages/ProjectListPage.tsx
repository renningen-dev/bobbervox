import { PlusIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { CreateProjectDialog } from "../components/projects/CreateProjectDialog";
import { ProjectCard } from "../components/projects/ProjectCard";
import { useProjects } from "../features/projects/api";
import { buttonStyles, cardStyles, cn } from "../lib/styles";

export function ProjectListPage() {
  const { data: projects, isLoading, error } = useProjects();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

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
        <button
          onClick={() => setIsCreateOpen(true)}
          className={cn(buttonStyles.base, buttonStyles.primary)}
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          New Project
        </button>
      </div>

      {projects?.length === 0 ? (
        <div className={cn(cardStyles.base, "p-12 text-center")}>
          <p className="text-gray-500 dark:text-gray-400 mb-4">No projects yet</p>
          <button
            onClick={() => setIsCreateOpen(true)}
            className={cn(buttonStyles.base, buttonStyles.primary)}
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Create your first project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects?.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

      <CreateProjectDialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />
    </div>
  );
}
