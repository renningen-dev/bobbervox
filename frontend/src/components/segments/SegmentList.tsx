import type { Segment } from "../../types";
import { SegmentCard } from "./SegmentCard";

interface SegmentListProps {
  segments: Segment[];
  projectId: string;
}

export function SegmentList({ segments, projectId }: SegmentListProps) {
  if (segments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No segments yet.</p>
        <p className="text-sm mt-1">
          Drag on the waveform to select a region and create a segment.
        </p>
      </div>
    );
  }

  // Sort segments by start time
  const sortedSegments = [...segments].sort((a, b) => a.start_time - b.start_time);

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-medium text-gray-900">
        Segments ({segments.length})
      </h3>
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
