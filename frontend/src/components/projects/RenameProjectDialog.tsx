import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
import { useState } from "react";
import { toast } from "sonner";
import { useUpdateProject } from "../../features/projects/api";
import { buttonStyles, cn, inputStyles } from "../../lib/styles";

interface RenameProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  currentName: string;
}

export function RenameProjectDialog({ isOpen, onClose, projectId, currentName }: RenameProjectDialogProps) {
  // Track local edit - null means using currentName prop
  const [localName, setLocalName] = useState<string | null>(null);
  const name = localName ?? currentName;
  const updateProject = useUpdateProject();

  const handleClose = () => {
    setLocalName(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      await updateProject.mutateAsync({
        id: projectId,
        data: { name: name.trim() },
      });
      toast.success("Project renamed");
      handleClose();
    } catch {
      toast.error("Failed to rename project");
    }
  };

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
      <DialogBackdrop transition className="fixed inset-0 bg-black/30 dark:bg-black/70 transition-opacity duration-200 data-[closed]:opacity-0" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel transition className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-xl dark:outline dark:outline-white/15 p-6 transition duration-200 ease-out data-[closed]:opacity-0 data-[closed]:scale-95">
          <DialogTitle className="text-lg font-medium text-gray-900 dark:text-white">
            Rename Project
          </DialogTitle>

          <form onSubmit={handleSubmit} className="mt-4">
            <input
              type="text"
              value={name}
              onChange={(e) => setLocalName(e.target.value)}
              className={inputStyles.base}
              placeholder="Project name"
              autoFocus
            />

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={updateProject.isPending}
                className={cn(buttonStyles.base, buttonStyles.secondary)}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updateProject.isPending || !name.trim() || name.trim() === currentName}
                className={cn(buttonStyles.base, buttonStyles.primary)}
              >
                {updateProject.isPending ? "Renaming..." : "Rename"}
              </button>
            </div>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
