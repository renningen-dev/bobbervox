# BobberVox Frontend

React-based frontend for the BobberVox video dubbing application.

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Headless UI** - Accessible components
- **TanStack Query** - Server state management
- **Zustand** - Client state management
- **React Router** - Routing
- **WaveSurfer.js** - Audio waveform visualization
- **Firebase** - Authentication
- **React Hook Form + Zod** - Form handling

## Development

### Prerequisites

- Node.js 20+
- Backend running at `http://localhost:8000`

### Setup

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Configure Firebase credentials in .env
```

### Environment Variables

```bash
VITE_API_URL=http://localhost:8000/api
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=yourproject.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=yourproject
VITE_FIREBASE_STORAGE_BUCKET=yourproject.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

### Run Development Server

```bash
npm run dev
```

App runs at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

Output in `dist/` directory.

### Linting & Type Check

```bash
npm run lint
npm run type-check
```

## Project Structure

```
src/
├── app/                    # App root, providers
├── components/
│   ├── auth/               # Auth components (ProtectedRoute, AuthProvider)
│   ├── editor/             # Editor components (VideoUpload, SegmentPanel)
│   ├── layout/             # Layout components (Sidebar, Header)
│   ├── projects/           # Project components (ProjectCard, ProjectList)
│   ├── segments/           # Segment components (SegmentCard, TTSControls)
│   ├── ui/                 # Generic UI components (Button, Dialog)
│   └── waveform/           # Waveform components (WaveformPlayer)
├── features/               # API hooks organized by feature
│   ├── projects/           # Project API hooks
│   ├── segments/           # Segment API hooks
│   └── settings/           # Settings API hooks
├── hooks/                  # Custom React hooks
├── lib/                    # Utilities (api-client, firebase, styles)
├── pages/                  # Route page components
├── stores/                 # Zustand stores
│   ├── authStore.ts        # Authentication state
│   ├── editorStore.ts      # Editor state
│   ├── themeStore.ts       # Theme state
│   └── uiStore.ts          # UI state
└── types/                  # TypeScript types
```

## Key Features

### Authentication

Firebase Authentication with Google and GitHub providers using FirebaseUI.

### Waveform Editor

WaveSurfer.js integration for audio visualization with region selection for creating segments.

### Segment Workflow

1. Select region on waveform
2. Extract audio segment
3. AI analysis (transcription, translation, voice parameters)
4. Edit translation and voice instructions
5. Generate TTS with selected voice
6. Preview and download result

### State Management

- **Zustand** for client state (auth, UI, editor)
- **TanStack Query** for server state (projects, segments)

## Docker Build

```bash
# Build image (requires Firebase env vars as build args)
docker build \
  --build-arg VITE_FIREBASE_API_KEY=... \
  --build-arg VITE_FIREBASE_AUTH_DOMAIN=... \
  --build-arg VITE_FIREBASE_PROJECT_ID=... \
  --build-arg VITE_FIREBASE_STORAGE_BUCKET=... \
  --build-arg VITE_FIREBASE_MESSAGING_SENDER_ID=... \
  --build-arg VITE_FIREBASE_APP_ID=... \
  -t bobbervox-frontend .
```

Or use docker-compose from the root directory which passes these automatically from `.env`.
