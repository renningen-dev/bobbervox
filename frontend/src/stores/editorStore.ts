import { create } from "zustand";

interface PendingRegion {
  id: string;
  start: number;
  end: number;
}

interface EditorState {
  // Current project context
  currentProjectId: string | null;

  // Waveform state
  selectedRegionId: string | null;
  pendingRegion: PendingRegion | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  zoomLevel: number;

  // Actions
  setCurrentProjectId: (id: string | null) => void;
  setSelectedRegionId: (id: string | null) => void;
  setPendingRegion: (region: PendingRegion | null) => void;
  setIsPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setZoomLevel: (level: number) => void;
  clearPendingRegion: () => void;
  reset: () => void;
}

const initialState = {
  currentProjectId: null,
  selectedRegionId: null,
  pendingRegion: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  zoomLevel: 1,
};

export const useEditorStore = create<EditorState>((set) => ({
  ...initialState,

  setCurrentProjectId: (id) => set({ currentProjectId: id }),
  setSelectedRegionId: (id) => set({ selectedRegionId: id }),
  setPendingRegion: (region) => set({ pendingRegion: region }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setDuration: (duration) => set({ duration: duration }),
  setZoomLevel: (level) => set({ zoomLevel: level }),
  clearPendingRegion: () => set({ pendingRegion: null }),
  reset: () => set(initialState),
}));
