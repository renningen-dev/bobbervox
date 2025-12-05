import {
  ChevronDownIcon,
  ChevronUpIcon,
  SpeakerWaveIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  useAnalyzeSegment,
  useDeleteSegment,
  useGenerateTTS,
  useUpdateAnalysis,
  useUpdateTranslation,
} from "../../features/segments/api";
import { ApiError, getFileUrl } from "../../lib/api-client";
import { buttonStyles, cardStyles, cn } from "../../lib/styles";
import { useEditorStore } from "../../stores/editorStore";
import type { Segment, TTSVoice } from "../../types";
import { TTS_VOICES } from "../../types";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { Spinner } from "../ui/Spinner";

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
  created: "bg-gray-100 text-gray-700",
  extracting: "bg-yellow-100 text-yellow-700",
  extracted: "bg-blue-100 text-blue-700",
  analyzing: "bg-purple-100 text-purple-700",
  analyzed: "bg-indigo-100 text-indigo-700",
  generating_tts: "bg-orange-100 text-orange-700",
  completed: "bg-green-100 text-green-700",
  error: "bg-red-100 text-red-700",
};

export function SegmentCard({ segment, projectId }: SegmentCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<TTSVoice>("alloy");
  // Track local edits to translation, null means no local edits (use segment value)
  const [localTranslation, setLocalTranslation] = useState<string | null>(null);
  const translationText = localTranslation ?? segment.translated_text ?? "";
  const hasLocalEdits = localTranslation !== null && localTranslation !== (segment.translated_text ?? "");

  const analyzeSegment = useAnalyzeSegment();
  const generateTTS = useGenerateTTS();
  const updateTranslation = useUpdateTranslation();
  const updateAnalysis = useUpdateAnalysis();
  const deleteSegment = useDeleteSegment();
  const setHoveredSegmentId = useEditorStore((s) => s.setHoveredSegmentId);

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
  const emphasisText = currentAnalysis.emphasis.join(", ");
  const pauseBeforeText = currentAnalysis.pause_before.join(", ");

  const hasAnalysisEdits = localAnalysis !== null;

  const handleAnalyze = async () => {
    try {
      await analyzeSegment.mutateAsync(segment.id);
      toast.success("Analysis complete");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleGenerateTTS = async () => {
    try {
      await generateTTS.mutateAsync({
        segmentId: segment.id,
        data: { voice: selectedVoice },
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

  const audioUrl = segment.audio_file
    ? getFileUrl(projectId, "segments", segment.audio_file.split("/").pop() || segment.audio_file)
    : null;

  const ttsUrl = segment.tts_result_file
    ? getFileUrl(projectId, "output", segment.tts_result_file.split("/").pop() || segment.tts_result_file)
    : null;

  const isProcessing =
    analyzeSegment.isPending ||
    generateTTS.isPending;

  return (
    <>
      <div
        className={cn(cardStyles.base, "overflow-hidden")}
        onMouseEnter={() => setHoveredSegmentId(segment.id)}
        onMouseLeave={() => setHoveredSegmentId(null)}
      >
        {/* Header */}
        <div
          className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-3">
            <button className="text-gray-400">
              {isExpanded ? (
                <ChevronUpIcon className="w-5 h-5" />
              ) : (
                <ChevronDownIcon className="w-5 h-5" />
              )}
            </button>
            <div>
              <span className="font-mono text-sm text-gray-600">
                {formatTime(segment.start_time)} - {formatTime(segment.end_time)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={cn(
                "px-2 py-0.5 rounded text-xs font-medium",
                statusColors[segment.status] || statusColors.created
              )}
            >
              {segment.status.replace("_", " ")}
            </span>

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
        </div>

        {/* Expanded content */}
        {isExpanded && (
          <div className="border-t border-gray-100 p-4 space-y-4">
            {/* Segment audio player */}
            {audioUrl && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Segment Audio
                </h4>
                <audio src={audioUrl} controls className="w-full h-8" />
              </div>
            )}

            {/* Actions based on status */}
            {segment.status === "extracted" && (
              <button
                onClick={handleAnalyze}
                disabled={isProcessing}
                className={cn(buttonStyles.base, buttonStyles.primary, "w-full")}
              >
                <SpeakerWaveIcon className="w-4 h-4 mr-2" />
                {analyzeSegment.isPending ? "Analyzing..." : "Analyze with AI"}
              </button>
            )}

            {/* Analysis display */}
            {segment.analysis_json && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-700">AI Analysis</h4>
                  {updateAnalysis.isPending && <Spinner size="sm" />}
                </div>
                <div className="bg-gray-50 rounded-lg p-3 space-y-3 text-sm">
                  {segment.original_transcription && (
                    <div>
                      <span className="font-medium text-gray-600">Transcription: </span>
                      <span className="text-gray-800">{segment.original_transcription}</span>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-medium text-gray-600 mb-1">Tone</label>
                      <input
                        type="text"
                        value={currentAnalysis.tone}
                        onChange={(e) => updateAnalysisField("tone", e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-gray-600 mb-1">Emotion</label>
                      <input
                        type="text"
                        value={currentAnalysis.emotion}
                        onChange={(e) => updateAnalysisField("emotion", e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-gray-600 mb-1">Style</label>
                      <input
                        type="text"
                        value={currentAnalysis.style}
                        onChange={(e) => updateAnalysisField("style", e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-gray-600 mb-1">Pace</label>
                      <input
                        type="text"
                        value={currentAnalysis.pace}
                        onChange={(e) => updateAnalysisField("pace", e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-gray-600 mb-1">Intonation</label>
                      <input
                        type="text"
                        value={currentAnalysis.intonation}
                        onChange={(e) => updateAnalysisField("intonation", e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-gray-600 mb-1">Voice</label>
                      <input
                        type="text"
                        value={currentAnalysis.voice}
                        onChange={(e) => updateAnalysisField("voice", e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-gray-600 mb-1">Tempo</label>
                      <input
                        type="text"
                        value={currentAnalysis.tempo}
                        onChange={(e) => updateAnalysisField("tempo", e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-gray-600 mb-1">Emphasis</label>
                      <input
                        type="text"
                        value={emphasisText}
                        onChange={(e) => updateArrayField("emphasis", e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-gray-600 mb-1">Pause before</label>
                      <input
                        type="text"
                        value={pauseBeforeText}
                        onChange={(e) => updateArrayField("pause_before", e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Translation editor */}
            {(segment.status === "analyzed" || segment.status === "completed" || segment.status === "generating_tts") && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Translation
                </h4>
                <textarea
                  value={translationText}
                  onChange={(e) => setLocalTranslation(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
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
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Text-to-Speech
                </h4>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedVoice}
                    onChange={(e) => setSelectedVoice(e.target.value as TTSVoice)}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {TTS_VOICES.map((voice) => (
                      <option key={voice} value={voice}>
                        {voice.charAt(0).toUpperCase() + voice.slice(1)}
                      </option>
                    ))}
                  </select>
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
            {ttsUrl && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Generated Audio
                </h4>
                <audio src={ttsUrl} controls className="w-full h-8" />
              </div>
            )}

            {/* Error message */}
            {segment.error_message && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{segment.error_message}</p>
              </div>
            )}
          </div>
        )}
      </div>

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
