import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useDeleteProject } from "../../features/projects/api";
import { cn } from "../../lib/styles";
import type { ProjectListItem } from "../../types";
import { SUPPORTED_LANGUAGES } from "../../types";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { RenameProjectDialog } from "./RenameProjectDialog";

function getLanguageFlag(code: string): string {
  const lang = SUPPORTED_LANGUAGES.find((l) => l.code === code);
  return lang?.flag ?? `/flags/${code}.png`;
}

interface ProjectCardProps {
  project: ProjectListItem;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isRenameOpen, setIsRenameOpen] = useState(false);
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
      <div className={cn(
        "p-4 rounded-xl transition-all hover:shadow-lg",
        "bg-white/50 dark:bg-white/5 backdrop-blur-xl",
        "border border-white/50 dark:border-white/10",
        "shadow-lg shadow-black/5 dark:shadow-none"
      )}>
        <Link to={`/projects/${project.id}`} className="block relative">
          {/* Language indicator - top right */}
          <div className="absolute top-0 right-0 flex items-center gap-1.5 bg-black/5 dark:bg-white/10 rounded-lg px-2 py-1">
            <img
              src={getLanguageFlag(project.source_language)}
              alt={project.source_language}
              className="w-4 h-4 rounded-full object-cover"
            />
            <span className="text-gray-400 text-xs">→</span>
            <img
              src={getLanguageFlag(project.target_language)}
              alt={project.target_language}
              className="w-4 h-4 rounded-full object-cover"
            />
          </div>
          <h3 className="text-gray-900 dark:text-white truncate pr-20">{project.name}</h3>
          <div className="mt-2 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            <span>{formattedDate}</span>
            <span>{project.segment_count} segments</span>
          </div>
          <div className="mt-2">
            {project.source_video ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300">
                Video uploaded
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400">
                No video
              </span>
            )}
          </div>
        </Link>

        <div className="mt-3 pt-3 border-t border-black/5 dark:border-white/10 flex justify-end gap-2">
          <button
            onClick={(e) => {
              e.preventDefault();
              setIsRenameOpen(true);
            }}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <PencilIcon className="w-5 h-5" />
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              setIsDeleteOpen(true);
            }}
            className="text-gray-400 hover:text-red-500 transition-colors"
          >
            <TrashIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      <RenameProjectDialog
        isOpen={isRenameOpen}
        onClose={() => setIsRenameOpen(false)}
        projectId={project.id}
        currentName={project.name}
      />

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
