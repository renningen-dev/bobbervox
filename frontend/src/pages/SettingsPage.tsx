import { useState } from "react";
import { toast } from "sonner";
import { useSettings, useUpdateSettings } from "../features/settings/api";
import { buttonStyles, cardStyles, cn, inputStyles } from "../lib/styles";
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
        <div className={cn(cardStyles.base, "p-6")}>
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">OpenAI API Key</h2>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setLocalApiKey(e.target.value)}
              placeholder={settings?.openai_api_key_set ? "Key is set (enter new key to change)" : "Enter your OpenAI API key"}
              className={inputStyles.base}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {settings?.openai_api_key_set
                ? "API key is configured. Enter a new key to replace it."
                : "Required for audio analysis and TTS generation."}
            </p>
          </div>
        </div>

        {/* Context Description */}
        <div className={cn(cardStyles.base, "p-6")}>
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Audio Context</h2>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Context Description
            </label>
            <textarea
              value={contextDescription}
              onChange={(e) => setLocalContextDescription(e.target.value)}
              rows={4}
              className={inputStyles.base}
              placeholder="Describe the context of your audio content..."
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Describe the environment and style of your audio content. This helps the AI
              produce more accurate transcriptions and natural translations.
              <br />
              <span className="italic">
                Example: "The audio is from outdoor/rural environments.
                The speaker uses casual, relaxed language typical of fishing videos."
              </span>
            </p>
          </div>
        </div>

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
