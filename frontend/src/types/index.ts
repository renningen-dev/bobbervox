export type SegmentStatus =
  | "created"
  | "extracting"
  | "extracted"
  | "analyzing"
  | "analyzed"
  | "generating_tts"
  | "completed"
  | "error";

export interface Project {
  id: string;
  name: string;
  source_language: string;
  target_language: string;
  created_at: string;
  source_video: string | null;
  extracted_audio: string | null;
}

export interface ProjectWithSegments extends Project {
  segments: Segment[];
}

export interface ProjectListItem extends Project {
  segment_count: number;
}

export interface Segment {
  id: string;
  project_id: string;
  start_time: number;
  end_time: number;
  audio_file: string | null;
  original_transcription: string | null;
  translated_text: string | null;
  analysis_json: AnalysisResult | null;
  tts_voice: string | null;
  tts_result_file: string | null;
  status: SegmentStatus;
  error_message: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface AnalysisResult {
  transcription?: string;
  translated_text?: string;
  tone?: string;
  emotion?: string;
  style?: string;
  pace?: string;
  intonation?: string;
  voice?: string;
  tempo?: string;
  emphasis?: string[];
  pause_before?: string[];
}

export interface CreateProjectRequest {
  name: string;
  source_language?: string;
  target_language?: string;
}

export interface UpdateProjectRequest {
  name?: string;
  source_language?: string;
  target_language?: string;
}

export interface CreateSegmentRequest {
  start_time: number;
  end_time: number;
}

export interface TTSRequest {
  voice: string;
  // Analysis fields for TTS instructions
  tone?: string;
  emotion?: string;
  style?: string;
  pace?: string;
  intonation?: string;
  tempo?: string;
  emphasis?: string[];
  pause_before?: string[];
}

export interface UpdateTranslationRequest {
  translated_text: string;
}

export interface UpdateAnalysisRequest {
  tone?: string;
  emotion?: string;
  style?: string;
  pace?: string;
  intonation?: string;
  voice?: string;
  tempo?: string;
  emphasis?: string[];
  pause_before?: string[];
}

export const TTS_VOICES = [
  "alloy",
  "ash",
  "ballad",
  "cedar",
  "coral",
  "echo",
  "fable",
  "marin",
  "nova",
  "onyx",
  "sage",
  "shimmer",
  "verse",
] as const;

export type TTSVoice = (typeof TTS_VOICES)[number];

// Settings
export interface AppSettings {
  openai_api_key: string;
  openai_api_key_set: boolean;
  context_description: string;
}

export interface UpdateSettingsRequest {
  openai_api_key?: string;
  context_description?: string;
}

// Language definition with flag image path
export interface Language {
  code: string;
  name: string;
  flag: string; // path to flag image in /flags/
}

// Helper to get flag image path
export const getFlagPath = (code: string): string => `/flags/${code}.png`;

// Supported languages for dubbing
export const SUPPORTED_LANGUAGES: Language[] = [
  { code: "uk", name: "Ukrainian", flag: "/flags/uk.png" },
  { code: "en", name: "English", flag: "/flags/en.png" },
  { code: "es", name: "Spanish", flag: "/flags/es.png" },
  { code: "fr", name: "French", flag: "/flags/fr.png" },
  { code: "de", name: "German", flag: "/flags/de.png" },
  { code: "pt", name: "Portuguese", flag: "/flags/pt.png" },
  { code: "zh", name: "Chinese", flag: "/flags/zh.png" },
  { code: "tl", name: "Filipino", flag: "/flags/tl.png" },
  { code: "no", name: "Norwegian", flag: "/flags/no.png" },
  { code: "pl", name: "Polish", flag: "/flags/pl.png" },
  { code: "ko", name: "Korean", flag: "/flags/ko.png" },
  { code: "ja", name: "Japanese", flag: "/flags/ja.png" },
];

// Source languages with Ukrainian first
export const SOURCE_LANGUAGES: Language[] = [
  { code: "uk", name: "Ukrainian", flag: "/flags/uk.png" },
  { code: "en", name: "English", flag: "/flags/en.png" },
  { code: "es", name: "Spanish", flag: "/flags/es.png" },
  { code: "fr", name: "French", flag: "/flags/fr.png" },
  { code: "de", name: "German", flag: "/flags/de.png" },
  { code: "pt", name: "Portuguese", flag: "/flags/pt.png" },
  { code: "zh", name: "Chinese", flag: "/flags/zh.png" },
  { code: "tl", name: "Filipino", flag: "/flags/tl.png" },
  { code: "no", name: "Norwegian", flag: "/flags/no.png" },
  { code: "pl", name: "Polish", flag: "/flags/pl.png" },
  { code: "ko", name: "Korean", flag: "/flags/ko.png" },
  { code: "ja", name: "Japanese", flag: "/flags/ja.png" },
];

// Target languages with English first
export const TARGET_LANGUAGES: Language[] = [
  { code: "en", name: "English", flag: "/flags/en.png" },
  { code: "uk", name: "Ukrainian", flag: "/flags/uk.png" },
  { code: "es", name: "Spanish", flag: "/flags/es.png" },
  { code: "fr", name: "French", flag: "/flags/fr.png" },
  { code: "de", name: "German", flag: "/flags/de.png" },
  { code: "pt", name: "Portuguese", flag: "/flags/pt.png" },
  { code: "zh", name: "Chinese", flag: "/flags/zh.png" },
  { code: "tl", name: "Filipino", flag: "/flags/tl.png" },
  { code: "no", name: "Norwegian", flag: "/flags/no.png" },
  { code: "pl", name: "Polish", flag: "/flags/pl.png" },
  { code: "ko", name: "Korean", flag: "/flags/ko.png" },
  { code: "ja", name: "Japanese", flag: "/flags/ja.png" },
];

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]["code"];
