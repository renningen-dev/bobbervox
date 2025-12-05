import { TrashIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useDeleteProject } from "../../features/projects/api";
import { cardStyles, cn } from "../../lib/styles";
import type { ProjectListItem } from "../../types";
import { ConfirmDialog } from "../ui/ConfirmDialog";

interface ProjectCardProps {
  project: ProjectListItem;
}

export function ProjectCard({ project }: ProjectCardProps) {
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
      <div className={cn(cardStyles.base, "p-4 hover:shadow-md transition-shadow")}>
        <Link to={`/projects/${project.id}`} className="block">
          <h3 className="font-medium text-gray-900 truncate">{project.name}</h3>
          <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
            <span>{formattedDate}</span>
            <span>{project.segment_count} segments</span>
          </div>
          <div className="mt-2">
            {project.source_video ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                Video uploaded
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                No video
              </span>
            )}
          </div>
        </Link>

        <div className="mt-3 pt-3 border-t border-gray-100 flex justify-end">
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
