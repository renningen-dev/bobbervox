import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from "@headlessui/react";
import {
  ArrowDownTrayIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  useAnalyzeSegment,
  useDeleteSegment,
  useGenerateTTS,
  useUpdateAnalysis,
  useUpdateTranslation,
} from "../../features/segments/api";
import { useSettings } from "../../features/settings/api";
import { useCustomVoices } from "../../features/voices/api";
import { ApiError, fetchAuthenticatedAudio } from "../../lib/api-client";
import { buttonStyles, cn } from "../../lib/styles";
import { useEditorStore } from "../../stores/editorStore";
import type { Segment } from "../../types";
import { OPENAI_TTS_VOICES, CHATTERBOX_TTS_VOICES } from "../../types";
import { AudioPlayer } from "../ui/AudioPlayer";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { Spinner } from "../ui/Spinner";
import { VoiceListbox } from "../ui/VoiceListbox";
import { ChatterBoxParams } from "./ChatterBoxParams";

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.data) {
    const data = error.data as { detail?: string };
    if (data.detail) {
      return data.detail;
    }
  }
  return "An unexpected error occurred";
}

interface SegmentCardProps {
  segment: Segment;
  projectId: string;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toFixed(2).padStart(5, "0")}`;
}

const statusColors: Record<string, string> = {
  created: "bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-300",
  extracting: "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300",
  extracted: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
  analyzing: "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300",
  analyzed: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300",
  generating_tts: "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300",
  completed: "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300",
  error: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300",
};

export function SegmentCard({ segment, projectId }: SegmentCardProps) {
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Get TTS provider from settings
  const { data: settings } = useSettings();
  const { data: customVoices } = useCustomVoices();
  const ttsProvider = settings?.tts_provider ?? "openai";

  // Build voice list: predefined voices + custom voices (for ChatterBox only)
  const voices: string[] = ttsProvider === "chatterbox"
    ? [
        ...CHATTERBOX_TTS_VOICES,
        ...(customVoices?.map(v => `custom:${v.id}:${v.name}`) ?? []),
      ]
    : [...OPENAI_TTS_VOICES];

  const defaultVoice = ttsProvider === "chatterbox" ? "Emily.wav" : "alloy";

  const [selectedVoice, setSelectedVoice] = useState(defaultVoice);

  // Reset voice when provider changes
  useEffect(() => {
    setSelectedVoice(defaultVoice);
  }, [defaultVoice]);

  // Track local edits to translation, null means no local edits (use segment value)
  const [localTranslation, setLocalTranslation] = useState<string | null>(null);
  const translationText = localTranslation ?? segment.translated_text ?? "";
  const hasLocalEdits = localTranslation !== null && localTranslation !== (segment.translated_text ?? "");

  // Authenticated audio blob URLs
  const [audioBlobUrl, setAudioBlobUrl] = useState<string | null>(null);
  const [ttsBlobUrl, setTtsBlobUrl] = useState<string | null>(null);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [isLoadingTts, setIsLoadingTts] = useState(false);

  const analyzeSegment = useAnalyzeSegment(projectId);
  const generateTTS = useGenerateTTS();
  const updateTranslation = useUpdateTranslation();
  const updateAnalysis = useUpdateAnalysis();
  const deleteSegment = useDeleteSegment();
  const setHoveredSegmentId = useEditorStore((s) => s.setHoveredSegmentId);

  // Fetch segment audio with authentication
  useEffect(() => {
    if (!segment.audio_file) {
      setAudioBlobUrl(null);
      return;
    }

    let cancelled = false;
    setIsLoadingAudio(true);

    const filename = segment.audio_file.split("/").pop() || segment.audio_file;
    fetchAuthenticatedAudio(projectId, "segments", filename)
      .then((blobUrl) => {
        if (!cancelled) {
          setAudioBlobUrl(blobUrl);
        }
      })
      .catch(() => {
        // Silently fail - audio just won't load
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingAudio(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [segment.audio_file, projectId]);

  // Fetch TTS audio with authentication
  // Include segment.updated_at to re-fetch when TTS is regenerated (same filename, new content)
  useEffect(() => {
    if (!segment.tts_result_file) {
      setTtsBlobUrl(null);
      return;
    }

    let cancelled = false;
    setIsLoadingTts(true);

    // Revoke old blob URL before fetching new one
    if (ttsBlobUrl) {
      URL.revokeObjectURL(ttsBlobUrl);
      setTtsBlobUrl(null);
    }

    const filename = segment.tts_result_file.split("/").pop() || segment.tts_result_file;
    fetchAuthenticatedAudio(projectId, "output", filename)
      .then((blobUrl) => {
        if (!cancelled) {
          setTtsBlobUrl(blobUrl);
        } else {
          URL.revokeObjectURL(blobUrl);
        }
      })
      .catch(() => {
        // Silently fail - audio just won't load
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingTts(false);
        }
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [segment.tts_result_file, segment.updated_at, projectId]);

  // Local state for editable analysis fields
  const [localAnalysis, setLocalAnalysis] = useState<{
    tone?: string;
    emotion?: string;
    style?: string;
    pace?: string;
    intonation?: string;
    voice?: string;
    tempo?: string;
    emphasis?: string[];
    pause_before?: string[];
  } | null>(null);

  // Local state for ChatterBox params (initialized from analysis_json)
  const [chatterBoxParams, setChatterBoxParams] = useState({
    temperature: 0.8,
    exaggeration: 0.8,
    cfgWeight: 0.5,
    speedFactor: 1.0,
  });

  // Initialize ChatterBox params from analysis_json when available
  useEffect(() => {
    if (segment.analysis_json) {
      setChatterBoxParams({
        temperature: segment.analysis_json.temperature ?? 0.8,
        exaggeration: segment.analysis_json.exaggeration ?? 0.8,
        cfgWeight: segment.analysis_json.cfg_weight ?? 0.5,
        speedFactor: segment.analysis_json.speed_factor ?? 1.0,
      });
    }
  }, [segment.analysis_json]);

  const currentAnalysis = {
    tone: localAnalysis?.tone ?? segment.analysis_json?.tone ?? "",
    emotion: localAnalysis?.emotion ?? segment.analysis_json?.emotion ?? "",
    style: localAnalysis?.style ?? segment.analysis_json?.style ?? "",
    pace: localAnalysis?.pace ?? segment.analysis_json?.pace ?? "",
    intonation: localAnalysis?.intonation ?? segment.analysis_json?.intonation ?? "",
    voice: localAnalysis?.voice ?? segment.analysis_json?.voice ?? "",
    tempo: localAnalysis?.tempo ?? segment.analysis_json?.tempo ?? "",
    emphasis: localAnalysis?.emphasis ?? segment.analysis_json?.emphasis ?? [],
    pause_before: localAnalysis?.pause_before ?? segment.analysis_json?.pause_before ?? [],
  };

  // Convert arrays to comma-separated strings for display
  // Handle both string[] and object[] from API
  const toStringArray = (arr: unknown[]): string[] =>
    arr.map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object") {
        // Try common properties, or JSON stringify
        const obj = item as Record<string, unknown>;
        return obj.word ?? obj.text ?? obj.value ?? JSON.stringify(item);
      }
      return String(item);
    }) as string[];
  const emphasisText = toStringArray(currentAnalysis.emphasis).join(", ");
  const pauseBeforeText = toStringArray(currentAnalysis.pause_before).join(", ");

  const hasAnalysisEdits = localAnalysis !== null;

  const handleGenerateTTS = async () => {
    try {
      // Build request data based on TTS provider
      const data = ttsProvider === "chatterbox"
        ? {
            voice: selectedVoice,
            temperature: chatterBoxParams.temperature,
            exaggeration: chatterBoxParams.exaggeration,
            cfg_weight: chatterBoxParams.cfgWeight,
            speed_factor: chatterBoxParams.speedFactor,
          }
        : {
            voice: selectedVoice,
            tone: currentAnalysis.tone || undefined,
            emotion: currentAnalysis.emotion || undefined,
            style: currentAnalysis.style || undefined,
            pace: currentAnalysis.pace || undefined,
            intonation: currentAnalysis.intonation || undefined,
            tempo: currentAnalysis.tempo || undefined,
            emphasis: toStringArray(currentAnalysis.emphasis),
            pause_before: toStringArray(currentAnalysis.pause_before),
          };

      await generateTTS.mutateAsync({
        segmentId: segment.id,
        data,
      });
      toast.success("TTS audio generated");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleSaveTranslation = async () => {
    try {
      await updateTranslation.mutateAsync({
        segmentId: segment.id,
        data: { translated_text: translationText },
      });
      setLocalTranslation(null); // Clear local edits after save
      toast.success("Translation saved");
    } catch {
      toast.error("Failed to save translation");
    }
  };

  // Debounced auto-save for analysis
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasTriggeredAnalysisRef = useRef(false);
  const [isAnalyzingLocal, setIsAnalyzingLocal] = useState(false);

  // Auto-trigger analysis when segment is extracted (use ref to prevent double trigger)
  useEffect(() => {
    if (segment.status === "extracted" && !hasTriggeredAnalysisRef.current) {
      hasTriggeredAnalysisRef.current = true;
      setIsAnalyzingLocal(true);
      analyzeSegment.mutate(segment.id);
    }
  }, [segment.status, segment.id, analyzeSegment]);

  // Clear analyzing state and reset local edits when new data arrives
  useEffect(() => {
    if (segment.analysis_json || segment.status === "analyzed" || segment.status === "error" || segment.status === "completed") {
      setIsAnalyzingLocal(false);
      setLocalAnalysis(null);
      setLocalTranslation(null);
      hasTriggeredAnalysisRef.current = false; // Reset for potential retry
    }
  }, [segment.analysis_json, segment.status]);


  // Auto-save with debounce when analysis changes
  useEffect(() => {
    if (!hasAnalysisEdits) return;

    const saveAnalysis = async () => {
      try {
        await updateAnalysis.mutateAsync({
          segmentId: segment.id,
          data: currentAnalysis,
        });
        setLocalAnalysis(null);
      } catch {
        toast.error("Failed to save analysis");
      }
    };

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(saveAnalysis, 1000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasAnalysisEdits, segment.id, localAnalysis]);

  const updateAnalysisField = (field: string, value: string | string[]) => {
    setLocalAnalysis((prev) => ({
      ...currentAnalysis,
      ...prev,
      [field]: value,
    }));
  };

  const updateArrayField = (field: "emphasis" | "pause_before", text: string) => {
    const values = text.split(",").map((s) => s.trim()).filter(Boolean);
    updateAnalysisField(field, values);
  };

  const handleDelete = async () => {
    try {
      await deleteSegment.mutateAsync({
        segmentId: segment.id,
        projectId,
      });
      toast.success("Segment deleted");
    } catch {
      toast.error("Failed to delete segment");
    }
    setIsDeleteOpen(false);
  };

  const isProcessing =
    isAnalyzingLocal ||
    generateTTS.isPending;

  return (
    <>
      <Disclosure
        as="div"
        className={cn(
          "rounded-xl overflow-hidden",
          "bg-white/50 dark:bg-white/5 backdrop-blur-xl",
          "border border-white/50 dark:border-white/10",
          "shadow-lg shadow-black/5 dark:shadow-none"
        )}
        onMouseEnter={() => setHoveredSegmentId(segment.id)}
        onMouseLeave={() => setHoveredSegmentId(null)}
      >
        <>
          {/* Header */}
          <DisclosureButton className="group w-full p-4 flex items-center justify-between cursor-pointer text-left">
            <div className="flex items-center gap-3">
              <ChevronDownIcon
                className="size-5 fill-gray-500 group-data-[hover]:fill-gray-700 dark:fill-white/60 dark:group-data-[hover]:fill-white transition-transform duration-200 group-data-[open]:rotate-180"
              />
              <div>
                <span className="font-mono text-sm text-gray-700 dark:text-gray-200 group-data-[hover]:text-gray-900 dark:group-data-[hover]:text-white">
                  {formatTime(segment.start_time)} - {formatTime(segment.end_time)}
                  <span className="text-gray-500 dark:text-gray-400 ml-1">
                    ({(segment.end_time - segment.start_time).toFixed(1)}s)
                  </span>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
                {(isAnalyzingLocal || (segment.status === "analyzing" && !segment.analysis_json)) ? (
                  <span className="flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300">
                    <Spinner size="xs" />
                    Analyzing...
                  </span>
                ) : (segment.status === "generating_tts" || generateTTS.isPending) ? (
                  <span className="flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300">
                    <Spinner size="xs" />
                    Generating TTS...
                  </span>
                ) : (
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded text-xs font-medium",
                      statusColors[segment.status] || statusColors.created
                    )}
                  >
                    {segment.status.replace("_", " ")}
                  </span>
                )}

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsDeleteOpen(true);
                  }}
                  className="text-gray-400 hover:text-red-500 p-1"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </DisclosureButton>

          {/* Expanded content */}
          <DisclosurePanel
            transition
            className="border-t border-black/5 dark:border-white/5 p-4 space-y-4 origin-top transition-all duration-200 ease-out data-[closed]:opacity-0 data-[closed]:-translate-y-2"
          >
            {/* Segment audio player */}
            {segment.audio_file && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Segment Audio
                </h4>
                {isLoadingAudio ? (
                  <div className="flex items-center gap-2 py-2">
                    <Spinner size="sm" />
                    <span className="text-sm text-gray-500">Loading audio...</span>
                  </div>
                ) : audioBlobUrl ? (
                  <AudioPlayer src={audioBlobUrl} />
                ) : null}
              </div>
            )}

            {/* Error display with retry */}
            {segment.status === "error" && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <p className="text-sm font-medium text-red-700 dark:text-red-400 mb-1">Analysis Failed</p>
                {segment.error_message && (
                  <p className="text-sm text-red-600 dark:text-red-400 mb-3">{segment.error_message}</p>
                )}
                <button
                  onClick={() => analyzeSegment.mutate(segment.id)}
                  disabled={analyzeSegment.isPending}
                  className={cn(buttonStyles.base, buttonStyles.primary, "text-xs")}
                >
                  {analyzeSegment.isPending ? "Retrying..." : "Retry Analysis"}
                </button>
              </div>
            )}

            {/* Analysis display */}
            {segment.analysis_json && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">AI Analysis</h4>
                  {updateAnalysis.isPending && <Spinner size="sm" />}
                </div>
                <div className="bg-gray-200/60 dark:bg-white/5 rounded-lg p-3 space-y-3 text-sm">
                  {segment.original_transcription && (
                    <div>
                      <span className="font-medium text-gray-600 dark:text-gray-400">Transcription: </span>
                      <span className="text-gray-800 dark:text-gray-200">{segment.original_transcription}</span>
                    </div>
                  )}

                  {/* ChatterBox params (sliders) - show when using ChatterBox */}
                  {ttsProvider === "chatterbox" ? (
                    <div className="pt-2">
                      <ChatterBoxParams
                        temperature={chatterBoxParams.temperature}
                        exaggeration={chatterBoxParams.exaggeration}
                        cfgWeight={chatterBoxParams.cfgWeight}
                        speedFactor={chatterBoxParams.speedFactor}
                        onTemperatureChange={(v) => setChatterBoxParams((p) => ({ ...p, temperature: v }))}
                        onExaggerationChange={(v) => setChatterBoxParams((p) => ({ ...p, exaggeration: v }))}
                        onCfgWeightChange={(v) => setChatterBoxParams((p) => ({ ...p, cfgWeight: v }))}
                        onSpeedFactorChange={(v) => setChatterBoxParams((p) => ({ ...p, speedFactor: v }))}
                        disabled={isProcessing}
                      />
                    </div>
                  ) : (
                    /* OpenAI voice instruction fields */
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-medium text-gray-600 dark:text-gray-400 mb-1">Tone</label>
                        <input
                          type="text"
                          value={currentAnalysis.tone}
                          onChange={(e) => updateAnalysisField("tone", e.target.value)}
                          className="w-full px-3 py-1.5 text-sm rounded-lg bg-gray-200/60 dark:bg-white/5 border border-black/10 dark:border-white/10 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-white/25"
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-gray-600 dark:text-gray-400 mb-1">Emotion</label>
                        <input
                          type="text"
                          value={currentAnalysis.emotion}
                          onChange={(e) => updateAnalysisField("emotion", e.target.value)}
                          className="w-full px-3 py-1.5 text-sm rounded-lg bg-gray-200/60 dark:bg-white/5 border border-black/10 dark:border-white/10 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-white/25"
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-gray-600 dark:text-gray-400 mb-1">Style</label>
                        <input
                          type="text"
                          value={currentAnalysis.style}
                          onChange={(e) => updateAnalysisField("style", e.target.value)}
                          className="w-full px-3 py-1.5 text-sm rounded-lg bg-gray-200/60 dark:bg-white/5 border border-black/10 dark:border-white/10 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-white/25"
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-gray-600 dark:text-gray-400 mb-1">Pace</label>
                        <input
                          type="text"
                          value={currentAnalysis.pace}
                          onChange={(e) => updateAnalysisField("pace", e.target.value)}
                          className="w-full px-3 py-1.5 text-sm rounded-lg bg-gray-200/60 dark:bg-white/5 border border-black/10 dark:border-white/10 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-white/25"
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-gray-600 dark:text-gray-400 mb-1">Intonation</label>
                        <input
                          type="text"
                          value={currentAnalysis.intonation}
                          onChange={(e) => updateAnalysisField("intonation", e.target.value)}
                          className="w-full px-3 py-1.5 text-sm rounded-lg bg-gray-200/60 dark:bg-white/5 border border-black/10 dark:border-white/10 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-white/25"
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-gray-600 dark:text-gray-400 mb-1">Voice</label>
                        <input
                          type="text"
                          value={currentAnalysis.voice}
                          onChange={(e) => updateAnalysisField("voice", e.target.value)}
                          className="w-full px-3 py-1.5 text-sm rounded-lg bg-gray-200/60 dark:bg-white/5 border border-black/10 dark:border-white/10 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-white/25"
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-gray-600 dark:text-gray-400 mb-1">Tempo</label>
                        <input
                          type="text"
                          value={currentAnalysis.tempo}
                          onChange={(e) => updateAnalysisField("tempo", e.target.value)}
                          className="w-full px-3 py-1.5 text-sm rounded-lg bg-gray-200/60 dark:bg-white/5 border border-black/10 dark:border-white/10 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-white/25"
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-gray-600 dark:text-gray-400 mb-1">Emphasis</label>
                        <input
                          type="text"
                          value={emphasisText}
                          onChange={(e) => updateArrayField("emphasis", e.target.value)}
                          className="w-full px-3 py-1.5 text-sm rounded-lg bg-gray-200/60 dark:bg-white/5 border border-black/10 dark:border-white/10 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-white/25"
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-gray-600 dark:text-gray-400 mb-1">Pause before</label>
                        <input
                          type="text"
                          value={pauseBeforeText}
                          onChange={(e) => updateArrayField("pause_before", e.target.value)}
                          className="w-full px-3 py-1.5 text-sm rounded-lg bg-gray-200/60 dark:bg-white/5 border border-black/10 dark:border-white/10 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-white/25"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Translation editor */}
            {(segment.status === "analyzed" || segment.status === "completed" || segment.status === "generating_tts") && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Translation
                </h4>
                <textarea
                  value={translationText}
                  onChange={(e) => setLocalTranslation(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm rounded-lg bg-gray-200/60 dark:bg-white/5 border border-black/10 dark:border-white/10 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-white/25"
                  rows={3}
                  placeholder="Enter translated text..."
                />
                {hasLocalEdits && (
                  <button
                    onClick={handleSaveTranslation}
                    disabled={updateTranslation.isPending}
                    className={cn(buttonStyles.base, buttonStyles.secondary, "mt-2")}
                  >
                    {updateTranslation.isPending ? "Saving..." : "Save Translation"}
                  </button>
                )}
              </div>
            )}

            {/* TTS controls */}
            {(segment.status === "analyzed" || segment.status === "completed") && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Text-to-Speech
                </h4>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <VoiceListbox
                      value={selectedVoice}
                      onChange={setSelectedVoice}
                      voices={voices}
                      disabled={isProcessing}
                    />
                  </div>
                  <button
                    onClick={handleGenerateTTS}
                    disabled={isProcessing || !translationText}
                    className={cn(buttonStyles.base, buttonStyles.primary)}
                  >
                    {generateTTS.isPending ? "Generating..." : "Generate TTS"}
                  </button>
                </div>
              </div>
            )}

            {/* TTS result player */}
            {segment.tts_result_file && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Generated Audio</h4>
                {isLoadingTts ? (
                  <div className="flex items-center gap-2 py-2">
                    <Spinner size="sm" />
                    <span className="text-sm text-gray-500">Loading audio...</span>
                  </div>
                ) : ttsBlobUrl ? (
                  <div className="flex items-center gap-2">
                    <AudioPlayer src={ttsBlobUrl} className="flex-1" />
                    <a
                      href={ttsBlobUrl}
                      download={segment.tts_result_file.split("/").pop() || "tts_audio.mp3"}
                      className={cn(buttonStyles.base, buttonStyles.secondary, "p-1.5")}
                      title="Download TTS audio"
                    >
                      <ArrowDownTrayIcon className="w-4 h-4" />
                    </a>
                  </div>
                ) : null}
              </div>
            )}

          </DisclosurePanel>
        </>
      </Disclosure>

      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Segment"
        message="Are you sure you want to delete this segment? This action cannot be undone."
        confirmLabel="Delete"
        isLoading={deleteSegment.isPending}
      />
    </>
  );
}
