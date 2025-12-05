import { CloudArrowUpIcon } from "@heroicons/react/24/outline";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { useUploadVideo } from "../../features/projects/api";
import { cardStyles, cn } from "../../lib/styles";

interface VideoUploadDropzoneProps {
  projectId: string;
}

const ACCEPTED_TYPES = {
  "video/mp4": [".mp4"],
  "video/quicktime": [".mov"],
  "video/x-msvideo": [".avi"],
  "video/x-matroska": [".mkv"],
  "video/webm": [".webm"],
};

export function VideoUploadDropzone({ projectId }: VideoUploadDropzoneProps) {
  const [uploadProgress, setUploadProgress] = useState(0);
  const uploadVideo = useUploadVideo();

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      setUploadProgress(0);

      try {
        await uploadVideo.mutateAsync({ projectId, file });
        toast.success("Video uploaded successfully");
      } catch {
        toast.error("Failed to upload video");
      } finally {
        setUploadProgress(0);
      }
    },
    [projectId, uploadVideo]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxFiles: 1,
    disabled: uploadVideo.isPending,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        cardStyles.base,
        "p-12 border-2 border-dashed cursor-pointer transition-colors",
        isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400",
        uploadVideo.isPending && "opacity-50 cursor-not-allowed"
      )}
    >
      <input {...getInputProps()} />

      <div className="text-center">
        <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />

        {uploadVideo.isPending ? (
          <div className="mt-4">
            <p className="text-sm text-gray-600">Uploading video...</p>
            <div className="mt-2 w-48 mx-auto bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${uploadProgress || 10}%` }}
              />
            </div>
          </div>
        ) : (
          <>
            <p className="mt-4 text-sm text-gray-600">
              {isDragActive
                ? "Drop the video here"
                : "Drag and drop a video file, or click to select"}
            </p>
            <p className="mt-2 text-xs text-gray-500">
              MP4, MOV, AVI, MKV, or WebM up to 500MB
            </p>
          </>
        )}
      </div>
    </div>
  );
}
