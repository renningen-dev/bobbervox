import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { VideoUploadDropzone } from "../components/editor/VideoUploadDropzone";
import { SegmentList } from "../components/segments/SegmentList";
import { Spinner } from "../components/ui/Spinner";
import { WaveformPlayer } from "../components/waveform/WaveformPlayer";
import { useExtractAudio, useProject } from "../features/projects/api";
import { getFileUrl } from "../lib/api-client";
import { buttonStyles, cardStyles, cn } from "../lib/styles";
import { useEditorStore } from "../stores/editorStore";

export function ProjectEditorPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: project, isLoading, error } = useProject(projectId!);
  const setCurrentProjectId = useEditorStore((s) => s.setCurrentProjectId);

  useEffect(() => {
    setCurrentProjectId(projectId || null);
    return () => setCurrentProjectId(null);
  }, [projectId, setCurrentProjectId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading project...</div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">Failed to load project</div>
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
        <h1 className="text-2xl font-bold text-gray-500">{project.name}</h1>
      </div>

      {!project.source_video ? (
        <VideoUploadDropzone projectId={project.id} />
      ) : !project.extracted_audio ? (
        <div className={cn(cardStyles.base, "p-8 text-center")}>
          <p className="text-gray-600 mb-4">Video uploaded. Extract audio to continue.</p>
          <AudioExtractionButton projectId={project.id} />
        </div>
      ) : (
        <div className="space-y-6">
          <WaveformPlayer
            projectId={project.id}
            audioUrl={getFileUrl(project.id, "audio", "full_audio.wav")}
            segments={project.segments}
          />
          <SegmentList segments={project.segments} projectId={project.id} />
        </div>
      )}
    </div>
  );
}

function AudioExtractionButton({ projectId }: { projectId: string }) {
  const extractAudio = useExtractAudio();

  const handleExtract = async () => {
    try {
      await extractAudio.mutateAsync(projectId);
      toast.success("Audio extracted successfully");
    } catch {
      toast.error("Failed to extract audio");
    }
  };

  return (
    <button
      onClick={handleExtract}
      disabled={extractAudio.isPending}
      className={cn(buttonStyles.base, buttonStyles.primary)}
    >
      {extractAudio.isPending ? (
        <>
          <Spinner size="sm" className="mr-2" />
          Extracting...
        </>
      ) : (
        "Extract Audio"
      )}
    </button>
  );
}
