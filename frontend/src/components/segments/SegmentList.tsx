import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { toast } from "sonner";
import { downloadAuthenticatedFile, getApiBaseUrl } from "../../lib/api-client";
import { buttonStyles, cn } from "../../lib/styles";
import type { Segment } from "../../types";
import { Spinner } from "../ui/Spinner";
import { SegmentCard } from "./SegmentCard";

interface SegmentListProps {
  segments: Segment[];
  projectId: string;
}

export function SegmentList({ segments = [], projectId }: SegmentListProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  if (!segments || segments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <p>No segments yet.</p>
        <p className="text-sm mt-1">
          Drag on the waveform to select a region and create a segment.
        </p>
      </div>
    );
  }

  // Sort segments by start time
  const sortedSegments = [...segments].sort((a, b) => a.start_time - b.start_time);

  // Check if any segments have TTS results
  const hasTTSResults = segments.some((s) => s.tts_result_file);

  const handleDownloadAll = async () => {
    setIsDownloading(true);
    try {
      const url = `${getApiBaseUrl()}/files/${projectId}/download-all`;
      await downloadAuthenticatedFile(url, `${projectId}_tts_output.zip`);
      toast.success("Download started");
    } catch {
      toast.error("Failed to download files");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
          Segments ({segments.length})
        </h3>
        {hasTTSResults && (
          <button
            onClick={handleDownloadAll}
            disabled={isDownloading}
            className={cn(buttonStyles.base, buttonStyles.secondary, "text-sm")}
          >
            {isDownloading ? (
              <Spinner size="xs" className="mr-1.5" />
            ) : (
              <ArrowDownTrayIcon className="w-4 h-4 mr-1.5" />
            )}
            {isDownloading ? "Downloading..." : "Download All TTS"}
          </button>
        )}
      </div>
      {sortedSegments.map((segment) => (
        <SegmentCard
          key={segment.id}
          segment={segment}
          projectId={projectId}
        />
      ))}
    </div>
  );
}
