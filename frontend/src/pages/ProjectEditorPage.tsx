import { ArrowLeftIcon, ArrowRightIcon, PencilIcon } from "@heroicons/react/24/outline";
import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { VideoUploadDropzone } from "../components/editor/VideoUploadDropzone";
import { SegmentList } from "../components/segments/SegmentList";
import { LanguageListbox } from "../components/ui/LanguageListbox";
import { Spinner } from "../components/ui/Spinner";
import { WaveformPlayer } from "../components/waveform/WaveformPlayer";
import { useExtractAudio, useProject, useUpdateProject } from "../features/projects/api";
import { fetchAuthenticatedAudio } from "../lib/api-client";
import { buttonStyles, cn } from "../lib/styles";
import { useEditorStore } from "../stores/editorStore";
import { SOURCE_LANGUAGES, SUPPORTED_LANGUAGES, TARGET_LANGUAGES } from "../types";

export function ProjectEditorPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: project, isLoading, error } = useProject(projectId!);
  const setCurrentProjectId = useEditorStore((s) => s.setCurrentProjectId);
  const extractAudio = useExtractAudio();
  const hasTriggeredExtractionRef = useRef(false);
  const [audioBlobUrl, setAudioBlobUrl] = useState<string | null>(null);

  // Derive loading state: audio should be loaded but blob URL not yet available
  const isLoadingAudio = Boolean(project?.extracted_audio) && !audioBlobUrl;

  useEffect(() => {
    setCurrentProjectId(projectId || null);
    return () => setCurrentProjectId(null);
  }, [projectId, setCurrentProjectId]);

  useEffect(() => {
    if (project?.name) {
      document.title = `${project.name} - Bobber VOX`;
    }
    return () => {
      document.title = "Bobber VOX";
    };
  }, [project?.name]);

  // Auto-trigger audio extraction when video is uploaded but audio not extracted
  useEffect(() => {
    if (
      project?.source_video &&
      !project?.extracted_audio &&
      !hasTriggeredExtractionRef.current &&
      !extractAudio.isPending
    ) {
      hasTriggeredExtractionRef.current = true;
      extractAudio.mutate(project.id, {
        onSuccess: () => {
          toast.success("Audio extracted successfully");
        },
        onError: () => {
          toast.error("Failed to extract audio");
          hasTriggeredExtractionRef.current = false; // Allow retry
        },
      });
    }
  }, [project?.source_video, project?.extracted_audio, project?.id, extractAudio]);

  // Reset extraction flag when audio is extracted
  useEffect(() => {
    if (project?.extracted_audio) {
      hasTriggeredExtractionRef.current = false;
    }
  }, [project?.extracted_audio]);

  // Fetch audio with authentication
  useEffect(() => {
    if (!project?.id || !project?.extracted_audio) {
      return;
    }

    let cancelled = false;
    let blobUrlToRevoke: string | null = null;

    fetchAuthenticatedAudio(project.id, "audio", "full_audio.wav")
      .then((blobUrl) => {
        if (!cancelled) {
          blobUrlToRevoke = blobUrl;
          setAudioBlobUrl(blobUrl);
        } else {
          URL.revokeObjectURL(blobUrl);
        }
      })
      .catch(() => {
        if (!cancelled) {
          toast.error("Failed to load audio");
        }
      });

    return () => {
      cancelled = true;
      if (blobUrlToRevoke) {
        URL.revokeObjectURL(blobUrlToRevoke);
      }
      setAudioBlobUrl(null);
    };
  }, [project?.id, project?.extracted_audio]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 dark:text-gray-400">Loading project...</div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500 dark:text-red-400">Failed to load project</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link
          to="/projects"
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-medium text-gray-600 dark:text-gray-400">{project.name}</h1>
        <LanguageSelector
          projectId={project.id}
          sourceLanguage={project.source_language}
          targetLanguage={project.target_language}
        />
      </div>

      {!project.source_video ? (
        <VideoUploadDropzone projectId={project.id} />
      ) : !project.extracted_audio || isLoadingAudio || !audioBlobUrl ? (
        <div className={cn(
          "p-8 text-center rounded-xl",
          "bg-white/50 dark:bg-white/5 backdrop-blur-xl",
          "border border-white/50 dark:border-white/10",
          "shadow-lg shadow-black/5 dark:shadow-none"
        )}>
          <div className="flex flex-col items-center gap-3">
            <Spinner size="lg" />
            <p className="text-gray-600 dark:text-gray-400">
              {!project.extracted_audio ? "Extracting audio from video..." : "Loading audio..."}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <WaveformPlayer
            projectId={project.id}
            audioUrl={audioBlobUrl}
            segments={project.segments}
          />
          <SegmentList segments={project.segments} projectId={project.id} />
        </div>
      )}
    </div>
  );
}

function getLanguageInfo(code: string): { name: string; flag: string } {
  const lang = SUPPORTED_LANGUAGES.find((l) => l.code === code);
  return lang ? { name: lang.name, flag: lang.flag } : { name: code, flag: `/flags/${code}.png` };
}

interface LanguageSelectorProps {
  projectId: string;
  sourceLanguage: string;
  targetLanguage: string;
}

function LanguageSelector({ projectId, sourceLanguage, targetLanguage }: LanguageSelectorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [source, setSource] = useState(sourceLanguage);
  const [target, setTarget] = useState(targetLanguage);
  const updateProject = useUpdateProject();

  const handleSave = async () => {
    try {
      await updateProject.mutateAsync({
        id: projectId,
        data: {
          source_language: source,
          target_language: target,
        },
      });
      setIsEditing(false);
      toast.success("Languages updated");
    } catch {
      toast.error("Failed to update languages");
    }
  };

  const handleCancel = () => {
    setSource(sourceLanguage);
    setTarget(targetLanguage);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2 ml-auto">
        <LanguageListbox
          value={source}
          onChange={setSource}
          languages={SOURCE_LANGUAGES}
          className="w-40"
        />
        <ArrowRightIcon className="w-4 h-4 text-gray-400" />
        <LanguageListbox
          value={target}
          onChange={setTarget}
          languages={TARGET_LANGUAGES}
          className="w-40"
        />
        <button
          onClick={handleSave}
          disabled={updateProject.isPending}
          className={cn(buttonStyles.base, buttonStyles.primary, "py-1 px-2 text-xs")}
        >
          {updateProject.isPending ? "..." : "Save"}
        </button>
        <button
          onClick={handleCancel}
          disabled={updateProject.isPending}
          className={cn(buttonStyles.base, buttonStyles.secondary, "py-1 px-2 text-xs")}
        >
          Cancel
        </button>
      </div>
    );
  }

  const sourceInfo = getLanguageInfo(sourceLanguage);
  const targetInfo = getLanguageInfo(targetLanguage);

  return (
    <button
      onClick={() => setIsEditing(true)}
      className="flex items-center gap-2 ml-auto text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
    >
      <img src={sourceInfo.flag} alt={sourceInfo.name} className="w-5 h-5 rounded-full object-cover" />
      <ArrowRightIcon className="w-4 h-4 text-gray-400" />
      <img src={targetInfo.flag} alt={targetInfo.name} className="w-5 h-5 rounded-full object-cover" />
      <PencilIcon className="w-3 h-3" />
    </button>
  );
}

