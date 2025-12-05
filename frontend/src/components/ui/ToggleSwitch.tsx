import { Switch } from "@headlessui/react";
import { cn } from "../../lib/styles";

interface ToggleSwitchProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export function ToggleSwitch({ enabled, onChange, label, disabled }: ToggleSwitchProps) {
  return (
    <Switch
      checked={enabled}
      onChange={onChange}
      disabled={disabled}
      className={cn(
        "group relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent",
        "transition-colors duration-200 ease-in-out",
        "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        enabled ? "bg-blue-600" : "bg-gray-200"
      )}
    >
      {label && <span className="sr-only">{label}</span>}
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0",
          "transition duration-200 ease-in-out",
          enabled ? "translate-x-5" : "translate-x-0"
        )}
      />
    </Switch>
  );
}
