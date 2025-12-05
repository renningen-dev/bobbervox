import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useCreateSegment } from "../../features/segments/api";
import { useWaveSurfer } from "../../hooks/useWaveSurfer";
import { cardStyles, cn } from "../../lib/styles";
import { useEditorStore } from "../../stores/editorStore";
import type { Segment } from "../../types";
import { WaveformControls } from "./WaveformControls";
import type { Region } from "wavesurfer.js/dist/plugins/regions.js";

const REGION_COLOR_HIDDEN = "rgba(59, 130, 246, 0)";
const REGION_COLOR_VISIBLE = "rgba(59, 130, 246, 0.3)";
const REGION_HOVER_COLOR = "rgba(59, 130, 246, 0.6)";

interface WaveformPlayerProps {
  projectId: string;
  audioUrl: string;
  segments: Segment[];
}

export function WaveformPlayer({ projectId, audioUrl, segments = [] }: WaveformPlayerProps) {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [zoomLevel, setZoomLevel] = useState(50);
  const [showAllSegments, setShowAllSegments] = useState(true);
  const pendingRegionRef = useRef<Region | null>(null);

  const setCurrentTime = useEditorStore((s) => s.setCurrentTime);
  const setIsPlaying = useEditorStore((s) => s.setIsPlaying);
  const setPendingRegion = useEditorStore((s) => s.setPendingRegion);
  const setSelectedRegionId = useEditorStore((s) => s.setSelectedRegionId);
  const pendingRegion = useEditorStore((s) => s.pendingRegion);
  const hoveredSegmentId = useEditorStore((s) => s.hoveredSegmentId);

  const createSegment = useCreateSegment();

  const handleReady = useCallback(() => {
    // Nothing special needed on ready
  }, []);

  const handleTimeUpdate = useCallback((time: number) => {
    setCurrentTime(time);
  }, [setCurrentTime]);

  const handleRegionCreated = useCallback((region: Region) => {
    // Only track pending regions (new ones created by user)
    if (!region.id.startsWith("segment-")) {
      // Remove any previous pending region
      if (pendingRegionRef.current && pendingRegionRef.current.id !== region.id) {
        pendingRegionRef.current.remove();
      }
      pendingRegionRef.current = region;
      setPendingRegion({
        id: region.id,
        start: region.start,
        end: region.end,
      });
    }
  }, [setPendingRegion]);

  const handleRegionUpdated = useCallback((region: Region) => {
    // Update pending region if it's the one being edited
    if (!region.id.startsWith("segment-")) {
      setPendingRegion({
        id: region.id,
        start: region.start,
        end: region.end,
      });
    }
  }, [setPendingRegion]);

  const handleRegionClicked = useCallback((region: Region) => {
    if (region.id.startsWith("segment-")) {
      const segmentId = region.id.replace("segment-", "");
      setSelectedRegionId(segmentId);
    }
  }, [setSelectedRegionId]);

  const wavesurfer = useWaveSurfer({
    container,
    audioUrl,
    onReady: handleReady,
    onTimeUpdate: handleTimeUpdate,
    onRegionCreated: handleRegionCreated,
    onRegionUpdated: handleRegionUpdated,
    onRegionClicked: handleRegionClicked,
  });

  // Render existing segments as regions when ready, or when hover/visibility changes
  useEffect(() => {
    if (!wavesurfer.isReady) return;

    // Clear existing segment regions
    const existingRegions = wavesurfer.getRegions();
    existingRegions.forEach((region) => {
      if (region.id.startsWith("segment-")) {
        region.remove();
      }
    });

    // Add regions for each segment
    segments.forEach((segment) => {
      let color = REGION_COLOR_HIDDEN;

      if (segment.id === hoveredSegmentId) {
        // Hovered segment is always visible with highlight color
        color = REGION_HOVER_COLOR;
      } else if (showAllSegments) {
        // Show all segments when toggle is on
        color = REGION_COLOR_VISIBLE;
      }

      wavesurfer.addRegion(
        segment.start_time,
        segment.end_time,
        `segment-${segment.id}`,
        { color, drag: false, resize: false }
      );
    });
  }, [wavesurfer.isReady, segments, wavesurfer, showAllSegments, hoveredSegmentId]);

  // Sync play state with store
  const handlePlayStateChange = useCallback((playing: boolean) => {
    setIsPlaying(playing);
  }, [setIsPlaying]);

  // Watch for play state changes
  if (wavesurfer.isPlaying !== useEditorStore.getState().isPlaying) {
    handlePlayStateChange(wavesurfer.isPlaying);
  }

  const handleZoom = useCallback((level: number) => {
    setZoomLevel(level);
    wavesurfer.zoom(level);
  }, [wavesurfer]);

  const handleCreateSegment = useCallback(async () => {
    const pendingRegion = useEditorStore.getState().pendingRegion;
    if (!pendingRegion) {
      toast.error("No region selected. Drag on the waveform to select a region.");
      return;
    }

    try {
      await createSegment.mutateAsync({
        projectId,
        data: {
          start_time: pendingRegion.start,
          end_time: pendingRegion.end,
        },
      });

      // Clear the pending region after successful creation
      setPendingRegion(null);
      wavesurfer.removeRegion(pendingRegion.id);
      toast.success("Segment created");
    } catch {
      toast.error("Failed to create segment");
    }
  }, [projectId, createSegment, setPendingRegion, wavesurfer]);

  // Format time as MM:SS.mmm
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toFixed(2).padStart(5, "0")}`;
  };

  return (
    <div className={cn(cardStyles.base, "p-4")}>
      {/* Waveform container */}
      <div
        ref={setContainer}
        className="w-full min-h-[128px] bg-gray-50 dark:bg-gray-900 dark:outline dark:outline-white/5 rounded-lg"
      />

      {/* Time display */}
      <div className="mt-2 flex justify-between text-sm text-gray-500 dark:text-gray-400 font-mono">
        <span>{formatTime(wavesurfer.currentTime)}</span>
        <span>{formatTime(wavesurfer.duration)}</span>
      </div>

      {/* Controls */}
      <WaveformControls
        isPlaying={wavesurfer.isPlaying}
        isReady={wavesurfer.isReady}
        zoomLevel={zoomLevel}
        hasPendingRegion={pendingRegion !== null}
        isCreatingSegment={createSegment.isPending}
        showAllSegments={showAllSegments}
        onPlayPause={wavesurfer.playPause}
        onZoom={handleZoom}
        onCreateSegment={handleCreateSegment}
        onToggleShowSegments={() => setShowAllSegments(!showAllSegments)}
      />

    </div>
  );
}
