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
}

export interface CreateSegmentRequest {
  start_time: number;
  end_time: number;
}

export interface TTSRequest {
  voice: string;
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
