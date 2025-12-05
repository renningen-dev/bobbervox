import {
  Description,
  Field,
  Fieldset,
  Input,
  Label,
  Legend,
  Textarea,
} from "@headlessui/react";
import { useState } from "react";
import { toast } from "sonner";
import { useSettings, useUpdateSettings } from "../features/settings/api";
import { buttonStyles, cn } from "../lib/styles";
import { Spinner } from "../components/ui/Spinner";

export function SettingsPage() {
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();

  // Track local edits - null means using server value
  const [localApiKey, setLocalApiKey] = useState<string | null>(null);
  const [localContextDescription, setLocalContextDescription] = useState<string | null>(null);

  // Use local value if edited, otherwise server value
  const apiKey = localApiKey ?? settings?.openai_api_key ?? "";
  const contextDescription = localContextDescription ?? settings?.context_description ?? "";
  const hasChanges = localApiKey !== null || localContextDescription !== null;

  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync({
        openai_api_key: localApiKey !== null ? localApiKey : undefined,
        context_description: localContextDescription !== null ? localContextDescription : undefined,
      });
      // Clear local edits after save
      setLocalApiKey(null);
      setLocalContextDescription(null);
      toast.success("Settings saved");
    } catch {
      toast.error("Failed to save settings");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-medium text-gray-600 dark:text-gray-400 mb-6">Settings</h1>

      <div className="space-y-6">
        {/* OpenAI API Key */}
        <Fieldset className="space-y-4 rounded-xl bg-white/50 dark:bg-white/5 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-lg shadow-black/5 dark:shadow-none p-6">
          <Legend className="text-lg font-medium text-gray-900 dark:text-white">OpenAI API Key</Legend>
          <Field>
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              API Key
            </Label>
            <Description className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {settings?.openai_api_key_set
                ? "API key is configured. Enter a new key to replace it."
                : "Required for audio analysis and TTS generation."}
            </Description>
            <Input
              type="password"
              value={apiKey}
              onChange={(e) => setLocalApiKey(e.target.value)}
              placeholder={settings?.openai_api_key_set ? "Key is set (enter new key to change)" : "Enter your OpenAI API key"}
              className={cn(
                "mt-3 block w-full rounded-lg border border-black/10 dark:border-white/10 bg-gray-200/60 dark:bg-white/5 px-3 py-1.5 text-sm text-gray-900 dark:text-white",
                "focus:outline-none data-[focus]:outline-2 data-[focus]:-outline-offset-2 data-[focus]:outline-indigo-500 dark:data-[focus]:outline-white/25"
              )}
            />
          </Field>
        </Fieldset>

        {/* Context Description */}
        <Fieldset className="space-y-4 rounded-xl bg-white/50 dark:bg-white/5 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-lg shadow-black/5 dark:shadow-none p-6">
          <Legend className="text-lg font-medium text-gray-900 dark:text-white">Audio Context</Legend>
          <Field>
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Context Description
            </Label>
            <Description className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Describe the environment and style of your audio content. This helps the AI
              produce more accurate transcriptions and natural translations.
              <br />
              <span className="italic">
                Example: "The audio is from outdoor/rural environments.
                The speaker uses casual, relaxed language typical of fishing videos."
              </span>
            </Description>
            <Textarea
              value={contextDescription}
              onChange={(e) => setLocalContextDescription(e.target.value)}
              rows={4}
              placeholder="Describe the context of your audio content..."
              className={cn(
                "mt-3 block w-full resize-none rounded-lg border border-black/10 dark:border-white/10 bg-gray-200/60 dark:bg-white/5 px-3 py-1.5 text-sm text-gray-900 dark:text-white",
                "focus:outline-none data-[focus]:outline-2 data-[focus]:-outline-offset-2 data-[focus]:outline-indigo-500 dark:data-[focus]:outline-white/25"
              )}
            />
          </Field>
        </Fieldset>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={!hasChanges || updateSettings.isPending}
            className={cn(buttonStyles.base, buttonStyles.primary)}
          >
            {updateSettings.isPending ? (
              <>
                <Spinner size="sm" />
                Saving...
              </>
            ) : (
              "Save Settings"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
