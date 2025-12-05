import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import { getApiBaseUrl } from "../../lib/api-client";
import { buttonStyles, cn } from "../../lib/styles";
import type { Segment } from "../../types";
import { SegmentCard } from "./SegmentCard";

interface SegmentListProps {
  segments: Segment[];
  projectId: string;
}

export function SegmentList({ segments = [], projectId }: SegmentListProps) {
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
  const downloadAllUrl = `${getApiBaseUrl()}/files/${projectId}/download-all`;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
          Segments ({segments.length})
        </h3>
        {hasTTSResults && (
          <a
            href={downloadAllUrl}
            download
            className={cn(buttonStyles.base, buttonStyles.secondary, "text-sm")}
          >
            <ArrowDownTrayIcon className="w-4 h-4 mr-1.5" />
            Download All TTS
          </a>
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
