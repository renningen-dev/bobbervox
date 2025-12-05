# BobberVox: Audio Segment Translator — High-Level Specification

## 1. Project Overview

### 1.1 Purpose
A web application for video dubbing workflows that allows users to import videos, visualize audio waveforms, select segments, and process them through OpenAI's audio APIs for transcription, translation, and text-to-speech generation.

### 1.2 Core Workflow
1. User uploads a video file
2. System extracts audio track using FFmpeg
3. User views waveform and selects regions via WaveSurfer.js
4. Selected regions are extracted as separate audio files
5. Each segment is analyzed using `gpt-4o-audio-preview` API
6. User reviews/edits translated text and voice instructions
7. User generates TTS audio using OpenAI TTS API
8. Output files are collected with original timestamps in filenames

---

## 2. Technology Stack

| Component | Technology |
|-----------|------------|
| Backend | Python 3.11+ with FastAPI |
| Frontend | React 18 + TypeScript + Vite |
| Audio Visualization | WaveSurfer.js 7.x + Regions Plugin |
| Styling | Tailwind CSS |
| Audio Processing | FFmpeg (via subprocess or ffmpeg-python) |
| AI Services | OpenAI API (gpt-4o-audio-preview, tts-1-hd) |
| Database | SQLite (via SQLAlchemy) or JSON file storage |
| File Upload | FastAPI UploadFile |
| Containerization | Docker with Docker Compose |

---

## 3. Project Directory Structure

### 3.1 Application Structure
```
bobbervox/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI application entry
│   │   ├── config.py            # Configuration and environment
│   │   ├── models/              # Pydantic models and DB schemas
│   │   ├── routers/             # API route handlers
│   │   ├── services/            # Business logic services
│   │   └── utils/               # Helper utilities
│   ├── Dockerfile               # Backend container with FFmpeg
│   ├── requirements.txt
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── components/          # React components
│   │   ├── hooks/               # Custom React hooks
│   │   ├── services/            # API client
│   │   ├── stores/              # State management
│   │   ├── types/               # TypeScript interfaces
│   │   └── App.tsx
│   ├── Dockerfile               # Frontend container (optional)
│   └── package.json
│
├── docker-compose.yml           # Multi-container orchestration
│
└── projects/                    # Runtime data storage (mounted volume)
```

### 3.2 Runtime Project Directory (per project)
```
projects/{project_id}/
├── source/                      # Original uploaded video
│   └── video.mp4
├── audio/                       # Full extracted audio
│   └── full_audio.wav
├── segments/                    # Extracted segment files
│   └── segment_00m15s320ms.wav
└── output/                      # TTS result files
    └── tts_00m15s320ms.mp3
```

---

## 4. Docker Configuration

### 4.1 Backend Dockerfile Requirements

The backend container must include FFmpeg installation for audio/video processing.

**Base Image:** Python 3.11 slim or Alpine-based image

**Required System Dependencies:**
- ffmpeg (full installation with all codecs)
- libsndfile1 (for audio file handling)
- Any additional audio codec libraries as needed

**Dockerfile Specifications:**
- Use multi-stage build if needed to reduce final image size
- Install FFmpeg from official repositories (not static builds) for full codec support
- Set working directory to `/app`
- Copy requirements.txt and install Python dependencies
- Copy application code
- Expose port 8000
- Set entrypoint to run uvicorn

**FFmpeg Installation Requirements:**
- Must support input formats: MP4, MOV, AVI, MKV, WEBM
- Must support audio codecs: AAC, MP3, PCM, Opus, Vorbis
- Must support output: WAV (PCM 16-bit), MP3

### 4.2 Docker Compose Configuration

**Services:**
- `backend` — Python FastAPI application with FFmpeg
- `frontend` — React development server or Nginx for production (optional)

**Volumes:**
- Mount `./projects` directory for persistent storage of uploaded files and outputs
- Mount `.env` file or use environment variables for configuration

**Networks:**
- Internal network for service communication
- Exposed ports for development access

**Environment Variables to Pass:**
- OPENAI_API_KEY
- PROJECTS_DIR
- CORS_ORIGINS

---

## 5. Data Models

### 5.1 Project
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Unique project identifier |
| name | String | User-defined project name |
| created_at | DateTime | Creation timestamp |
| source_video | String (nullable) | Path to uploaded video |
| extracted_audio | String (nullable) | Path to extracted audio |

### 5.2 Segment
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Unique segment identifier |
| project_id | UUID | Parent project reference |
| start_time | Float | Start time in seconds |
| end_time | Float | End time in seconds |
| audio_file | String | Filename of extracted segment |
| original_transcription | String (nullable) | Original language text |
| translated_text | String (nullable) | English translation |
| analysis | AnalysisResult (nullable) | Voice analysis data |
| tts_result_file | String (nullable) | Generated TTS filename |
| status | Enum | Processing status |

### 5.3 AnalysisResult (from gpt-4o-audio-preview)
| Field | Type | Description |
|-------|------|-------------|
| translated_text | String | English translation |
| tone | String | e.g., "casual", "excited" |
| emotion | String | e.g., "enthusiastic", "calm" |
| style | String | Speaking style description |
| pace | String | e.g., "moderate", "fast" |
| intonation | String | Intonation patterns |
| voice | String | Voice characteristics |
| tempo | String | Rhythm description |
| emphasis | List[String] | Words/phrases to emphasize |
| pause_before | List[String] | Words requiring pauses |

### 5.4 Segment Status Enum
- `created` — Segment record created
- `extracting` — FFmpeg extracting audio
- `extracted` — Audio file ready
- `analyzing` — Sending to gpt-4o-audio-preview
- `analyzed` — Analysis complete
- `generating_tts` — TTS generation in progress
- `completed` — Full pipeline complete
- `error` — Processing failed

---

## 6. API Specification

### 6.1 Project Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/projects` | Create new project |
| GET | `/api/projects` | List all projects |
| GET | `/api/projects/{id}` | Get project with segments |
| DELETE | `/api/projects/{id}` | Delete project and all files |

### 6.2 Video/Audio Processing Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/projects/{id}/upload` | Upload video file |
| POST | `/api/projects/{id}/extract-audio` | Extract audio from video |
| GET | `/api/projects/{id}/waveform-data` | Get waveform peaks (optional optimization) |

### 6.3 Segment Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/projects/{id}/segments` | Create segment from time range |
| GET | `/api/projects/{id}/segments` | List all segments |
| GET | `/api/segments/{id}` | Get single segment |
| DELETE | `/api/segments/{id}` | Delete segment and files |
| PUT | `/api/segments/{id}/translation` | Update translated text manually |
| PUT | `/api/segments/{id}/analysis` | Update analysis fields manually |

### 6.4 AI Processing Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/segments/{id}/analyze` | Send to gpt-4o-audio-preview |
| POST | `/api/segments/{id}/generate-tts` | Generate TTS from translation |

### 6.5 File Serving Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/files/{project_id}/audio/{filename}` | Serve full audio |
| GET | `/api/files/{project_id}/segments/{filename}` | Serve segment audio |
| GET | `/api/files/{project_id}/output/{filename}` | Serve TTS output |

---

## 7. OpenAI API Integration

### 7.1 Audio Analysis (gpt-4o-audio-preview)

**Purpose:** Transcribe, translate, and analyze speaker characteristics from audio segments.

**System Message:**
```
You are an audio analysis assistant specialized in outdoor/rural environments. 
The audio is from a fishing video. Your task is to:

1. Transcribe the uploaded audio accurately.
2. Translate the text into English.
3. Analyze the speaker's delivery and describe:
   - Tone
   - Emotion
   - Speaking style (including hints for casual, outdoor, relaxed, or energetic context)
   - Pace, rhythm, and intonation
   - Volume, emphasis, and natural pauses
```

**User Prompt:**
```
Output everything in JSON format exactly like this:
{ "translated_text": "...", "tone": "...", "emotion": "...", "style": "...", "pace": "...", "intonation": "...", "voice": "...", "tempo": "...", "emphasis": [...], "pause_before": [...] }
```

**Request Requirements:**
- Model: `gpt-4o-audio-preview`
- Audio format: WAV or MP3
- Audio must be base64-encoded and sent in the message content
- Response format: JSON parsed from text response

### 7.2 Text-to-Speech Generation

**Purpose:** Generate dubbed audio from translated text with voice styling.

**API:** OpenAI TTS (`tts-1-hd` model)

**Parameters:**
- model: `tts-1-hd`
- voice: User-selectable (alloy, echo, fable, onyx, nova, shimmer)
- input: Translated text (optionally with SSML-like hints based on analysis)
- response_format: `mp3`

**Voice Selection Guidance:**
The analysis results (tone, emotion, style) should inform voice selection recommendations displayed to the user.

---

## 8. FFmpeg Requirements

### 8.1 Audio Extraction from Video
- Input: Video file (MP4, MOV, AVI, MKV, WEBM)
- Output: WAV file (PCM 16-bit, 44.1kHz, stereo)
- Strip video stream entirely

### 8.2 Segment Extraction
- Input: Full audio WAV file
- Parameters: Start time (seconds), End time (seconds)
- Output: WAV file with timestamp in filename
- Preserve audio quality (no re-encoding if possible)

### 8.3 Filename Format
Pattern: `segment_{MM}m{SS}s{mmm}ms.wav`

Examples:
- 15.32 seconds → `segment_00m15s320ms.wav`
- 125.5 seconds → `segment_02m05s500ms.wav`

---

## 9. Frontend Requirements

### 9.1 Main Views

**Project List View**
- Display all projects with name, creation date, segment count
- Create new project button
- Delete project with confirmation

**Project Editor View**
- Video/audio upload dropzone
- WaveSurfer waveform display with timeline
- Region selection and management
- Segment list with cards

### 9.2 WaveSurfer Integration

**Required Plugins:**
- Regions Plugin — For creating and editing time selections
- Timeline Plugin — For time reference display

**Functionality:**
- Play/Pause controls
- Zoom in/out
- Click-to-seek
- Drag to create new region
- Drag region edges to resize
- Double-click region to play only that region
- Visual distinction for extracted vs pending regions

### 9.3 Segment Card Component

**Sections:**
1. **Header** — Segment ID, time range, status badge
2. **Original Audio Player** — Play extracted segment
3. **Analysis Results Display** — Show all fields from gpt-4o-audio-preview response
4. **Translated Text** — Editable textarea
5. **Voice Instructions** — Editable fields for tone, emotion, style, etc.
6. **TTS Controls** — Voice selector dropdown, Generate button
7. **TTS Result** — Audio player for generated speech, download link

**Status Indicators:**
- Visual badge showing current processing status
- Loading spinners during API calls
- Error messages when processing fails

### 9.4 Editable Fields

All analysis and translation fields should be:
- Pre-populated from API response
- Editable by user before TTS generation
- Auto-saved on blur or with explicit save button

---

## 10. State Management

### 10.1 Global State (Zustand or Context)
- Current project data
- List of segments
- Loading states per segment
- Error states

### 10.2 Local Component State
- WaveSurfer instance reference
- Regions state
- Form input values
- Audio player states

---

## 11. Error Handling Requirements

### 11.1 Backend Errors
- File upload failures (size limits, format validation)
- FFmpeg processing errors
- OpenAI API errors (rate limits, invalid responses)
- File system errors

### 11.2 Frontend Error Display
- Toast notifications for transient errors
- Inline error messages for form validation
- Segment-level error status with retry option
- Global error boundary for unexpected failures

### 11.3 Validation Rules
- Maximum video file size: 500MB (configurable)
- Supported video formats: MP4, MOV, AVI, MKV, WEBM
- Minimum segment duration: 0.5 seconds
- Maximum segment duration: 60 seconds (API limit consideration)

---

## 12. Configuration Requirements

### 12.1 Environment Variables (Backend)
```
OPENAI_API_KEY=sk-...
PROJECTS_DIR=/app/projects
MAX_UPLOAD_SIZE_MB=500
ALLOWED_VIDEO_EXTENSIONS=.mp4,.mov,.avi,.mkv,.webm
CORS_ORIGINS=http://localhost:5173
```

### 12.2 Frontend Configuration
```
VITE_API_BASE_URL=http://localhost:8000/api
```

---

## 13. File Naming Conventions

### 13.1 Segment Audio Files
Pattern: `segment_{timestamp}.wav`
Location: `projects/{project_id}/segments/`

### 13.2 TTS Output Files
Pattern: `tts_{timestamp}.mp3`
Location: `projects/{project_id}/output/`

### 13.3 Timestamp Format
`{MM}m{SS}s{mmm}ms` where:
- MM = minutes (zero-padded)
- SS = seconds (zero-padded)
- mmm = milliseconds (zero-padded)

---

## 14. Performance Considerations

### 14.1 Large Audio Files
- Stream audio files instead of loading entirely into memory
- Consider generating waveform peaks server-side for very long files
- Implement chunked upload for large video files

### 14.2 Concurrent Processing
- Allow multiple segments to be processed in parallel
- Implement request queuing to respect OpenAI rate limits
- Show progress for long-running FFmpeg operations

### 14.3 Caching
- Cache waveform data after first generation
- Store analysis results in database to avoid re-processing

---

## 15. Export Functionality

### 15.1 Single Segment Export
- Download original segment audio
- Download TTS result audio
- Download analysis as JSON

### 15.2 Batch Export
- Export all TTS results as ZIP
- Include manifest JSON with metadata
- Maintain timestamp-based filenames

---

## 16. Future Considerations (Out of Scope)

- User authentication and multi-user support
- Cloud storage integration (S3, GCS)
- Video preview with synchronized playback
- Batch processing queue
- Custom voice cloning integration
- Real-time collaboration
- Version history for edits

---

## 17. Development Milestones

### Phase 1: Core Infrastructure
- Backend project structure and configuration
- Docker setup with FFmpeg
- Frontend scaffolding with routing
- File upload and storage system
- FFmpeg service for audio extraction

### Phase 2: Waveform Editor
- WaveSurfer integration
- Region creation and management
- Segment extraction workflow

### Phase 3: AI Integration
- gpt-4o-audio-preview integration
- Response parsing and storage
- TTS generation service

### Phase 4: UI Completion
- Segment cards with all fields
- Editing and manual override capability
- Audio players and download links

### Phase 5: Polish
- Error handling and validation
- Loading states and feedback
- Export functionality
- Testing and bug fixes

---

This specification provides the foundation for implementation.
