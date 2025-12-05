import {
  Description,
  Field,
  Fieldset,
  Input,
  Label,
  Legend,
  Radio,
  RadioGroup,
  Textarea,
} from "@headlessui/react";
import { ArrowPathIcon, CheckCircleIcon, XCircleIcon } from "@heroicons/react/20/solid";
import { useState } from "react";
import { toast } from "sonner";
import { useCheckChatterBoxHealth, useSettings, useUpdateSettings } from "../features/settings/api";
import { buttonStyles, cn } from "../lib/styles";
import { Spinner } from "../components/ui/Spinner";
import type { TTSProvider } from "../types";

export function SettingsPage() {
  const { data: settings, isLoading, refetch } = useSettings();
  const updateSettings = useUpdateSettings();
  const checkChatterBoxHealth = useCheckChatterBoxHealth();

  // Track local edits - null means using server value
  const [localApiKey, setLocalApiKey] = useState<string | null>(null);
  const [localContextDescription, setLocalContextDescription] = useState<string | null>(null);
  const [localTtsProvider, setLocalTtsProvider] = useState<TTSProvider | null>(null);

  // Use local value if edited, otherwise server value
  const apiKey = localApiKey ?? settings?.openai_api_key ?? "";
  const contextDescription = localContextDescription ?? settings?.context_description ?? "";
  const ttsProvider = localTtsProvider ?? settings?.tts_provider ?? "openai";
  const chatterboxAvailable = settings?.chatterbox_available ?? false;
  const hasChanges = localApiKey !== null || localContextDescription !== null || localTtsProvider !== null;

  const handleReconnectChatterBox = async () => {
    try {
      const result = await checkChatterBoxHealth.mutateAsync();
      if (result.available) {
        toast.success("ChatterBox connected successfully");
        refetch(); // Refresh settings to update availability
      } else {
        toast.error("ChatterBox server is not responding");
      }
    } catch {
      toast.error("Failed to connect to ChatterBox");
    }
  };

  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync({
        openai_api_key: localApiKey !== null ? localApiKey : undefined,
        context_description: localContextDescription !== null ? localContextDescription : undefined,
        tts_provider: localTtsProvider !== null ? localTtsProvider : undefined,
      });
      // Clear local edits after save
      setLocalApiKey(null);
      setLocalContextDescription(null);
      setLocalTtsProvider(null);
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
        {/* TTS Provider */}
        <Fieldset className="space-y-4 rounded-xl bg-white/50 dark:bg-white/5 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-lg shadow-black/5 dark:shadow-none p-6">
          <Legend className="text-lg font-medium text-gray-900 dark:text-white">TTS Provider</Legend>
          <Field>
            <Description className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              Choose the text-to-speech engine for generating audio.
            </Description>
            <RadioGroup
              value={ttsProvider}
              onChange={(value: TTSProvider) => setLocalTtsProvider(value)}
              className="space-y-2"
            >
              <Field className="flex items-center gap-3">
                <Radio
                  value="openai"
                  className={cn(
                    "group flex size-5 items-center justify-center rounded-full border",
                    "border-gray-300 dark:border-white/20 bg-white dark:bg-white/5",
                    "data-[checked]:border-indigo-500 data-[checked]:bg-indigo-500"
                  )}
                >
                  <span className="invisible size-2 rounded-full bg-white group-data-[checked]:visible" />
                </Radio>
                <Label className="text-sm text-gray-900 dark:text-white cursor-pointer">
                  <span className="font-medium">OpenAI</span>
                  <span className="text-gray-500 dark:text-gray-400 ml-2">
                    (gpt-4o-mini-tts - cloud, requires API key)
                  </span>
                </Label>
              </Field>
              <Field className="flex items-center gap-3">
                <Radio
                  value="chatterbox"
                  disabled={!chatterboxAvailable}
                  className={cn(
                    "group flex size-5 items-center justify-center rounded-full border",
                    "border-gray-300 dark:border-white/20 bg-white dark:bg-white/5",
                    "data-[checked]:border-indigo-500 data-[checked]:bg-indigo-500",
                    "data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed"
                  )}
                >
                  <span className="invisible size-2 rounded-full bg-white group-data-[checked]:visible" />
                </Radio>
                <Label className={cn(
                  "text-sm text-gray-900 dark:text-white",
                  chatterboxAvailable ? "cursor-pointer" : "cursor-not-allowed opacity-50"
                )}>
                  <span className="font-medium">ChatterBox</span>
                  <span className="text-gray-500 dark:text-gray-400 ml-2">
                    (local, free, voice cloning support)
                  </span>
                </Label>
              </Field>
            </RadioGroup>

            {/* ChatterBox Status */}
            <div className="mt-4 flex items-center gap-3 p-3 rounded-lg bg-gray-100 dark:bg-white/5">
              {chatterboxAvailable ? (
                <CheckCircleIcon className="h-5 w-5 text-green-500" />
              ) : (
                <XCircleIcon className="h-5 w-5 text-red-500" />
              )}
              <span className={cn(
                "text-sm",
                chatterboxAvailable ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"
              )}>
                {chatterboxAvailable ? "ChatterBox server is connected" : "ChatterBox server is not available"}
              </span>
              <button
                type="button"
                onClick={handleReconnectChatterBox}
                disabled={checkChatterBoxHealth.isPending}
                className={cn(
                  "ml-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md",
                  "bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-gray-300",
                  "hover:bg-gray-300 dark:hover:bg-white/20",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "transition-colors"
                )}
              >
                <ArrowPathIcon className={cn("h-3.5 w-3.5", checkChatterBoxHealth.isPending && "animate-spin")} />
                {checkChatterBoxHealth.isPending ? "Checking..." : "Reconnect"}
              </button>
            </div>
          </Field>
        </Fieldset>

        {/* OpenAI API Key - always visible (required for analysis) */}
        <Fieldset className="space-y-4 rounded-xl bg-white/50 dark:bg-white/5 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-lg shadow-black/5 dark:shadow-none p-6">
          <Legend className="text-lg font-medium text-gray-900 dark:text-white">OpenAI API Key</Legend>
          <Field>
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              API Key
            </Label>
            <Description className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {settings?.openai_api_key_set
                ? "API key is configured. Enter a new key to replace it."
                : "Required for audio analysis (transcription & translation)."}
              {ttsProvider === "chatterbox" && (
                <span className="block mt-1 text-amber-600 dark:text-amber-400">
                  Note: API key is still needed for analysis even when using ChatterBox for TTS.
                </span>
              )}
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
