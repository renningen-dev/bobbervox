import { PauseIcon, PlayIcon } from "@heroicons/react/24/solid";
import { useCallback, useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";

interface AudioPlayerProps {
  src: string;
  className?: string;
}

export function AudioPlayer({ src, className = "" }: AudioPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;

    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: "rgb(156, 163, 175)",
      progressColor: "rgb(168, 85, 247)",
      cursorColor: "transparent",
      barWidth: 3,
      barGap: 2,
      barRadius: 3,
      height: 40,
      normalize: true,
      backend: "WebAudio",
    });

    ws.load(src);

    ws.on("ready", () => {
      setIsReady(true);
      setDuration(ws.getDuration());
    });

    ws.on("play", () => setIsPlaying(true));
    ws.on("pause", () => setIsPlaying(false));
    ws.on("finish", () => setIsPlaying(false));
    ws.on("timeupdate", (time) => setCurrentTime(time));

    wavesurferRef.current = ws;

    return () => {
      ws.destroy();
    };
  }, [src]);

  const togglePlay = useCallback(() => {
    wavesurferRef.current?.playPause();
  }, []);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <button
        onClick={togglePlay}
        disabled={!isReady}
        className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-purple-500 hover:bg-purple-400 dark:bg-purple-600 dark:hover:bg-purple-500 text-white disabled:opacity-50 transition-colors"
      >
        {isPlaying ? (
          <PauseIcon className="w-4 h-4" />
        ) : (
          <PlayIcon className="w-4 h-4 ml-0.5" />
        )}
      </button>

      <div className="flex-1 min-w-0 relative">
        <div ref={containerRef} className={isReady ? "" : "opacity-0"} />
        {!isReady && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 dark:border-gray-600 border-t-purple-500" />
              <span className="text-xs text-gray-400 dark:text-gray-500">Loading...</span>
            </div>
          </div>
        )}
      </div>

      <span className="flex-shrink-0 text-xs font-mono text-gray-500 dark:text-gray-400 whitespace-nowrap">
        {formatTime(currentTime)}/{formatTime(duration)}
      </span>
    </div>
  );
}
