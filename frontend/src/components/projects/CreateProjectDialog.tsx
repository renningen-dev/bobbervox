import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import { useCreateProject } from "../../features/projects/api";
import { buttonStyles, cn, inputStyles } from "../../lib/styles";

const schema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name is too long"),
});

type FormData = z.infer<typeof schema>;

interface CreateProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateProjectDialog({ isOpen, onClose }: CreateProjectDialogProps) {
  const navigate = useNavigate();
  const createProject = useCreateProject();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: "" },
  });

  const onSubmit = async (data: FormData) => {
    try {
      const project = await createProject.mutateAsync(data);
      toast.success("Project created");
      reset();
      onClose();
      navigate(`/projects/${project.id}`);
    } catch {
      toast.error("Failed to create project");
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-black/30" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-md bg-white rounded-lg shadow-xl p-6">
          <DialogTitle className="text-lg font-medium text-gray-900">
            Create New Project
          </DialogTitle>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                Project Name
              </label>
              <input
                id="name"
                type="text"
                {...register("name")}
                className={cn(inputStyles.base, "mt-1")}
                placeholder="My Video Project"
                autoFocus
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={createProject.isPending}
                className={cn(buttonStyles.base, buttonStyles.secondary)}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createProject.isPending}
                className={cn(buttonStyles.base, buttonStyles.primary)}
              >
                {createProject.isPending ? "Creating..." : "Create"}
              </button>
            </div>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
