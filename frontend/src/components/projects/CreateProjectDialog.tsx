import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import { useCreateProject } from "../../features/projects/api";
import { buttonStyles, cn, inputStyles } from "../../lib/styles";
import { SOURCE_LANGUAGES, TARGET_LANGUAGES } from "../../types";
import { LanguageListbox } from "../ui/LanguageListbox";

const schema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name is too long"),
  source_language: z.string().min(1, "Source language is required"),
  target_language: z.string().min(1, "Target language is required"),
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
    control,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      source_language: "uk",
      target_language: "en",
    },
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
      <DialogBackdrop transition className="fixed inset-0 bg-black/30 dark:bg-black/70 transition-opacity duration-200 data-[closed]:opacity-0" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel transition className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-xl dark:outline dark:outline-white/15 p-6 transition duration-200 ease-out data-[closed]:opacity-0 data-[closed]:scale-95">
          <DialogTitle className="text-lg font-medium text-gray-900 dark:text-white">
            Create New Project
          </DialogTitle>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
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
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Source Language
                </label>
                <Controller
                  name="source_language"
                  control={control}
                  render={({ field }) => (
                    <LanguageListbox
                      value={field.value}
                      onChange={field.onChange}
                      languages={SOURCE_LANGUAGES}
                    />
                  )}
                />
                {errors.source_language && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.source_language.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Target Language
                </label>
                <Controller
                  name="target_language"
                  control={control}
                  render={({ field }) => (
                    <LanguageListbox
                      value={field.value}
                      onChange={field.onChange}
                      languages={TARGET_LANGUAGES}
                    />
                  )}
                />
                {errors.target_language && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.target_language.message}</p>
                )}
              </div>
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
