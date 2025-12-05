import {
  Description,
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { buttonStyles, cn } from "../../lib/styles";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  isLoading = false,
}: ConfirmDialogProps) {
  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <DialogBackdrop transition className="fixed inset-0 bg-black/30 transition-opacity duration-200 data-[closed]:opacity-0" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel transition className="w-full max-w-md bg-white rounded-lg shadow-xl p-6 transition duration-200 ease-out data-[closed]:opacity-0 data-[closed]:scale-95">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <DialogTitle className="text-lg font-medium text-gray-900">
                {title}
              </DialogTitle>
              <Description className="mt-2 text-sm text-gray-500">
                {message}
              </Description>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className={cn(buttonStyles.base, buttonStyles.secondary)}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={cn(buttonStyles.base, buttonStyles.danger)}
            >
              {isLoading ? "..." : confirmLabel}
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
