import { TrashIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useDeleteProject } from "../../features/projects/api";
import { cardStyles, cn } from "../../lib/styles";
import type { ProjectListItem } from "../../types";
import { SUPPORTED_LANGUAGES } from "../../types";
import { ConfirmDialog } from "../ui/ConfirmDialog";

interface ProjectTableProps {
  projects: ProjectListItem[];
}

function getLanguageFlag(code: string): string {
  const lang = SUPPORTED_LANGUAGES.find((l) => l.code === code);
  return lang?.flag ?? `/flags/${code}.png`;
}

function ProjectTableRow({ project }: { project: ProjectListItem }) {
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const deleteProject = useDeleteProject();

  const handleDelete = async () => {
    try {
      await deleteProject.mutateAsync(project.id);
      toast.success("Project deleted");
    } catch {
      toast.error("Failed to delete project");
    }
    setIsDeleteOpen(false);
  };

  const formattedDate = new Date(project.created_at).toLocaleDateString();

  return (
    <>
      <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
        <td className="px-4 py-3">
          <Link
            to={`/projects/${project.id}`}
            className="font-medium text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400"
          >
            {project.name}
          </Link>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <img
              src={getLanguageFlag(project.source_language)}
              alt={project.source_language}
              className="w-5 h-5 rounded-full object-cover"
            />
            <span className="text-gray-400">→</span>
            <img
              src={getLanguageFlag(project.target_language)}
              alt={project.target_language}
              className="w-5 h-5 rounded-full object-cover"
            />
          </div>
        </td>
        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
          {project.segment_count}
        </td>
        <td className="px-4 py-3">
          {project.source_video ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300">
              Yes
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400">
              No
            </span>
          )}
        </td>
        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
          {formattedDate}
        </td>
        <td className="px-4 py-3 text-right">
          <button
            onClick={() => setIsDeleteOpen(true)}
            className="text-gray-400 hover:text-red-500 transition-colors"
          >
            <TrashIcon className="w-5 h-5" />
          </button>
        </td>
      </tr>

      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Project"
        message={`Are you sure you want to delete "${project.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        isLoading={deleteProject.isPending}
      />
    </>
  );
}

export function ProjectTable({ projects }: ProjectTableProps) {
  return (
    <div className={cn(cardStyles.base, "overflow-hidden")}>
      <table className="w-full">
        <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Name
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Languages
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Segments
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Video
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Created
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {projects.map((project) => (
            <ProjectTableRow key={project.id} project={project} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
