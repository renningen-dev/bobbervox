import {
  EyeIcon,
  EyeSlashIcon,
  ExclamationTriangleIcon,
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
  hasOpenAIKey: boolean;
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
  hasOpenAIKey,
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
            "px-5 py-2"
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
            buttonStyles.secondary,
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
      <div className="relative group">
        <button
          onClick={onCreateSegment}
          disabled={!hasPendingRegion || isCreatingSegment || !hasOpenAIKey}
          className={cn(buttonStyles.base, buttonStyles.primary)}
          title={hasOpenAIKey ? "Create segment from selection" : "OpenAI API key required"}
        >
          {!hasOpenAIKey && (
            <ExclamationTriangleIcon className="w-4 h-4 mr-1 text-amber-300" />
          )}
          {hasOpenAIKey && <PlusIcon className="w-4 h-4 mr-1" />}
          Create Segment
        </button>

        {/* Tooltip when no API key */}
        {!hasOpenAIKey && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 text-xs text-white bg-gray-900 dark:bg-gray-700 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
            <div className="flex items-center gap-2">
              <ExclamationTriangleIcon className="w-4 h-4 text-amber-400" />
              <span>Configure OpenAI API key in Settings</span>
            </div>
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700" />
          </div>
        )}
      </div>
    </div>
  );
}
