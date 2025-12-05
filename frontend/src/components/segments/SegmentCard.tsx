import {
  ChevronDownIcon,
  ChevronUpIcon,
  PlayIcon,
  SpeakerWaveIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";
import { toast } from "sonner";
import {
  useAnalyzeSegment,
  useDeleteSegment,
  useExtractSegment,
  useGenerateTTS,
  useUpdateTranslation,
} from "../../features/segments/api";
import { buttonStyles, cardStyles, cn } from "../../lib/styles";
import type { Segment, TTSVoice } from "../../types";
import { TTS_VOICES } from "../../types";
import { ConfirmDialog } from "../ui/ConfirmDialog";

interface SegmentCardProps {
  segment: Segment;
  projectId: string;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toFixed(2).padStart(5, "0")}`;
}

// Extract just the filename from a path like "project_id/segments/file.wav"
function getFilename(path: string): string {
  return path.split("/").pop() || path;
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
  const [translationText, setTranslationText] = useState(segment.translated_text || "");

  const extractSegment = useExtractSegment();
  const analyzeSegment = useAnalyzeSegment();
  const generateTTS = useGenerateTTS();
  const updateTranslation = useUpdateTranslation();
  const deleteSegment = useDeleteSegment();

  const handleExtract = async () => {
    try {
      await extractSegment.mutateAsync(segment.id);
      toast.success("Segment audio extracted");
    } catch {
      toast.error("Failed to extract segment audio");
    }
  };

  const handleAnalyze = async () => {
    try {
      await analyzeSegment.mutateAsync(segment.id);
      toast.success("Analysis complete");
    } catch {
      toast.error("Failed to analyze segment");
    }
  };

  const handleGenerateTTS = async () => {
    try {
      await generateTTS.mutateAsync({
        segmentId: segment.id,
        data: { voice: selectedVoice },
      });
      toast.success("TTS audio generated");
    } catch {
      toast.error("Failed to generate TTS");
    }
  };

  const handleSaveTranslation = async () => {
    try {
      await updateTranslation.mutateAsync({
        segmentId: segment.id,
        data: { translated_text: translationText },
      });
      toast.success("Translation saved");
    } catch {
      toast.error("Failed to save translation");
    }
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
    ? `http://localhost:8000/api/files/${projectId}/segments/${getFilename(segment.audio_file)}`
    : null;

  const ttsUrl = segment.tts_result_file
    ? `http://localhost:8000/api/files/${projectId}/output/${getFilename(segment.tts_result_file)}`
    : null;

  const isProcessing =
    extractSegment.isPending ||
    analyzeSegment.isPending ||
    generateTTS.isPending;

  return (
    <>
      <div className={cn(cardStyles.base, "overflow-hidden")}>
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
            {segment.status === "created" && (
              <button
                onClick={handleExtract}
                disabled={isProcessing}
                className={cn(buttonStyles.base, buttonStyles.primary, "w-full")}
              >
                <PlayIcon className="w-4 h-4 mr-2" />
                {extractSegment.isPending ? "Extracting..." : "Extract Audio"}
              </button>
            )}

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
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  AI Analysis
                </h4>
                <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
                  {segment.original_transcription && (
                    <div>
                      <span className="font-medium text-gray-600">Transcription: </span>
                      <span className="text-gray-800">{segment.original_transcription}</span>
                    </div>
                  )}
                  {segment.analysis_json.tone && (
                    <div>
                      <span className="font-medium text-gray-600">Tone: </span>
                      <span className="text-gray-800">{segment.analysis_json.tone}</span>
                    </div>
                  )}
                  {segment.analysis_json.emotion && (
                    <div>
                      <span className="font-medium text-gray-600">Emotion: </span>
                      <span className="text-gray-800">{segment.analysis_json.emotion}</span>
                    </div>
                  )}
                  {segment.analysis_json.pace && (
                    <div>
                      <span className="font-medium text-gray-600">Pace: </span>
                      <span className="text-gray-800">{segment.analysis_json.pace}</span>
                    </div>
                  )}
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
                  onChange={(e) => setTranslationText(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Enter translated text..."
                />
                <button
                  onClick={handleSaveTranslation}
                  disabled={updateTranslation.isPending}
                  className={cn(buttonStyles.base, buttonStyles.secondary, "mt-2")}
                >
                  {updateTranslation.isPending ? "Saving..." : "Save Translation"}
                </button>
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
