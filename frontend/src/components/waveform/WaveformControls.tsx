import {
  EyeIcon,
  EyeSlashIcon,
  MagnifyingGlassMinusIcon,
  MagnifyingGlassPlusIcon,
  PauseIcon,
  PlayIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { buttonStyles, cn } from "../../lib/styles";

interface WaveformControlsProps {
  isPlaying: boolean;
  isReady: boolean;
  zoomLevel: number;
  hasPendingRegion: boolean;
  isCreatingSegment: boolean;
  showAllSegments: boolean;
  onPlayPause: () => void;
  onZoom: (level: number) => void;
  onCreateSegment: () => void;
  onToggleShowSegments: () => void;
}

const MIN_ZOOM = 10;
const MAX_ZOOM = 500;
const ZOOM_STEP = 50;

export function WaveformControls({
  isPlaying,
  isReady,
  zoomLevel,
  hasPendingRegion,
  isCreatingSegment,
  showAllSegments,
  onPlayPause,
  onZoom,
  onCreateSegment,
  onToggleShowSegments,
}: WaveformControlsProps) {
  const handleZoomIn = () => {
    const newLevel = Math.min(zoomLevel + ZOOM_STEP, MAX_ZOOM);
    onZoom(newLevel);
  };

  const handleZoomOut = () => {
    const newLevel = Math.max(zoomLevel - ZOOM_STEP, MIN_ZOOM);
    onZoom(newLevel);
  };

  return (
    <div className="mt-4 flex items-center justify-between">
      {/* Playback controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={onPlayPause}
          disabled={!isReady}
          className={cn(
            buttonStyles.base,
            buttonStyles.primary,
            "w-14 h-10 p-0"
          )}
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <PauseIcon className="w-5 h-5" />
          ) : (
            <PlayIcon className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Zoom and segment visibility controls */}
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleShowSegments}
          disabled={!isReady}
          className={cn(
            buttonStyles.base,
            showAllSegments ? buttonStyles.primary : buttonStyles.secondary,
            "p-2"
          )}
          title={showAllSegments ? "Hide segments" : "Show segments"}
        >
          {showAllSegments ? (
            <EyeIcon className="w-4 h-4" />
          ) : (
            <EyeSlashIcon className="w-4 h-4" />
          )}
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomOut}
            disabled={!isReady || zoomLevel <= MIN_ZOOM}
            className={cn(buttonStyles.base, buttonStyles.secondary, "p-2")}
            title="Zoom out"
          >
            <MagnifyingGlassMinusIcon className="w-4 h-4" />
          </button>

          <span className="text-xs text-gray-500 dark:text-gray-400 w-12 text-center">
            {zoomLevel}px/s
          </span>

          <button
            onClick={handleZoomIn}
            disabled={!isReady || zoomLevel >= MAX_ZOOM}
            className={cn(buttonStyles.base, buttonStyles.secondary, "p-2")}
            title="Zoom in"
          >
            <MagnifyingGlassPlusIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Create segment button */}
      <button
        onClick={onCreateSegment}
        disabled={!hasPendingRegion || isCreatingSegment}
        className={cn(buttonStyles.base, buttonStyles.primary)}
        title="Create segment from selection"
      >
        <PlusIcon className="w-4 h-4 mr-1" />
        Create Segment
      </button>
    </div>
  );
}
