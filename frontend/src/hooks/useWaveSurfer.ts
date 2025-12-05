import { useCallback, useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import RegionsPlugin, { type Region } from "wavesurfer.js/dist/plugins/regions.js";

export interface WaveSurferOptions {
  container: HTMLElement | null;
  audioUrl: string | null;
  onReady?: () => void;
  onTimeUpdate?: (time: number) => void;
  onRegionCreated?: (region: Region) => void;
  onRegionUpdated?: (region: Region) => void;
  onRegionClicked?: (region: Region) => void;
}

// Store callbacks in refs to avoid re-creating wavesurfer on callback changes
function useCallbackRef<T extends (...args: never[]) => void>(callback: T | undefined) {
  const ref = useRef<T | undefined>(callback);
  useEffect(() => {
    ref.current = callback;
  });
  return ref;
}

export interface WaveSurferInstance {
  isReady: boolean;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  play: () => void;
  pause: () => void;
  playPause: () => void;
  seekTo: (time: number) => void;
  zoom: (pxPerSec: number) => void;
  addRegion: (start: number, end: number, id?: string, options?: { color?: string; drag?: boolean; resize?: boolean }) => Region | null;
  removeRegion: (id: string) => void;
  clearRegions: () => void;
  getRegions: () => Region[];
  setRegionColor: (id: string, color: string) => void;
}

export function useWaveSurfer({
  container,
  audioUrl,
  onReady,
  onTimeUpdate,
  onRegionCreated,
  onRegionUpdated,
  onRegionClicked,
}: WaveSurferOptions): WaveSurferInstance {
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const regionsRef = useRef<RegionsPlugin | null>(null);

  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Store callbacks in refs to avoid re-creating wavesurfer
  const onReadyRef = useCallbackRef(onReady);
  const onTimeUpdateRef = useCallbackRef(onTimeUpdate);
  const onRegionCreatedRef = useCallbackRef(onRegionCreated);
  const onRegionUpdatedRef = useCallbackRef(onRegionUpdated);
  const onRegionClickedRef = useCallbackRef(onRegionClicked);

  // Initialize WaveSurfer
  useEffect(() => {
    if (!container || !audioUrl) return;

    const regions = RegionsPlugin.create();
    regionsRef.current = regions;

    const ws = WaveSurfer.create({
      container,
      waveColor: "#a1a1aa",
      progressColor: "#3b82f6",
      cursorColor: "#1d4ed8",
      cursorWidth: 2,
      height: 128,
      normalize: true,
      plugins: [regions],
    });

    wavesurferRef.current = ws;

    // Load audio
    ws.load(audioUrl);

    // Event handlers
    ws.on("ready", () => {
      setIsReady(true);
      setDuration(ws.getDuration());
      onReadyRef.current?.();
    });

    ws.on("play", () => setIsPlaying(true));
    ws.on("pause", () => setIsPlaying(false));

    ws.on("timeupdate", (time) => {
      setCurrentTime(time);
      onTimeUpdateRef.current?.(time);
    });

    // Region events
    regions.on("region-created", (region) => {
      onRegionCreatedRef.current?.(region);
    });

    regions.on("region-updated", (region) => {
      onRegionUpdatedRef.current?.(region);
    });

    regions.on("region-clicked", (region, e) => {
      e.stopPropagation();
      onRegionClickedRef.current?.(region);
    });

    // Enable region creation by dragging
    regions.enableDragSelection({
      color: "rgba(59, 130, 246, 0.3)",
    });

    return () => {
      ws.destroy();
      wavesurferRef.current = null;
      regionsRef.current = null;
      setIsReady(false);
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
    };
  }, [container, audioUrl, onReadyRef, onTimeUpdateRef, onRegionCreatedRef, onRegionUpdatedRef, onRegionClickedRef]);

  // Playback controls
  const play = useCallback(() => {
    wavesurferRef.current?.play();
  }, []);

  const pause = useCallback(() => {
    wavesurferRef.current?.pause();
  }, []);

  const playPause = useCallback(() => {
    wavesurferRef.current?.playPause();
  }, []);

  const seekTo = useCallback((time: number) => {
    const ws = wavesurferRef.current;
    if (ws && duration > 0) {
      ws.seekTo(time / duration);
    }
  }, [duration]);

  const zoom = useCallback((pxPerSec: number) => {
    wavesurferRef.current?.zoom(pxPerSec);
  }, []);

  // Region management
  const addRegion = useCallback((
    start: number,
    end: number,
    id?: string,
    options?: { color?: string; drag?: boolean; resize?: boolean }
  ): Region | null => {
    const regions = regionsRef.current;
    if (!regions) return null;

    return regions.addRegion({
      id,
      start,
      end,
      color: options?.color ?? "rgba(59, 130, 246, 0.3)",
      drag: options?.drag ?? true,
      resize: options?.resize ?? true,
    });
  }, []);

  const removeRegion = useCallback((id: string) => {
    const regions = regionsRef.current;
    if (!regions) return;

    const allRegions = regions.getRegions();
    const region = allRegions.find((r) => r.id === id);
    region?.remove();
  }, []);

  const clearRegions = useCallback(() => {
    regionsRef.current?.clearRegions();
  }, []);

  const getRegions = useCallback((): Region[] => {
    return regionsRef.current?.getRegions() ?? [];
  }, []);

  const setRegionColor = useCallback((id: string, color: string) => {
    const regions = regionsRef.current;
    if (!regions) return;

    const allRegions = regions.getRegions();
    const region = allRegions.find((r) => r.id === id);
    if (region) {
      // Access the DOM element directly and change its background
      const element = region.element;
      if (element) {
        element.style.backgroundColor = color;
      }
    }
  }, []);

  return {
    isReady,
    isPlaying,
    currentTime,
    duration,
    play,
    pause,
    playPause,
    seekTo,
    zoom,
    addRegion,
    removeRegion,
    clearRegions,
    getRegions,
    setRegionColor,
  };
}
