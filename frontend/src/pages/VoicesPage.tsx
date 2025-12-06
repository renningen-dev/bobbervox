import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { ArrowDownTrayIcon, MicrophoneIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useCallback, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import {
  useCreateCustomVoice,
  useCustomVoices,
  useDeleteCustomVoice,
} from "../features/voices/api";
import { useSettings } from "../features/settings/api";
import { buttonStyles, cn } from "../lib/styles";
import { Spinner } from "../components/ui/Spinner";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { AudioPlayer } from "../components/ui/AudioPlayer";
import { getApiBaseUrl } from "../lib/api-client";
import { useAuthStore } from "../stores/authStore";

export function VoicesPage() {
  const { data: settings } = useSettings();
  const { data: voices, isLoading } = useCustomVoices();
  const createVoice = useCreateCustomVoice();
  const deleteVoice = useDeleteCustomVoice();

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isRecordOpen, setIsRecordOpen] = useState(false);
  const [deleteVoiceId, setDeleteVoiceId] = useState<string | null>(null);

  // Upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [voiceName, setVoiceName] = useState("");
  const [voiceDescription, setVoiceDescription] = useState("");

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isChatterbox = settings?.tts_provider === "chatterbox";

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setUploadFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "audio/*": [".wav", ".mp3", ".ogg", ".m4a"],
    },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024, // 50MB
  });

  const handleUpload = async () => {
    if (!uploadFile || !voiceName.trim()) return;

    try {
      await createVoice.mutateAsync({
        name: voiceName.trim(),
        description: voiceDescription.trim() || undefined,
        file: uploadFile,
      });
      toast.success("Voice uploaded successfully");
      setIsUploadOpen(false);
      setUploadFile(null);
      setVoiceName("");
      setVoiceDescription("");
    } catch {
      toast.error("Failed to upload voice");
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/wav" });
        setRecordedBlob(blob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((t) => t + 1);
      }, 1000);
    } catch {
      toast.error("Failed to access microphone");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const handleSaveRecording = async () => {
    if (!recordedBlob || !voiceName.trim()) return;

    const file = new File([recordedBlob], `${voiceName}.wav`, { type: "audio/wav" });

    try {
      await createVoice.mutateAsync({
        name: voiceName.trim(),
        description: voiceDescription.trim() || undefined,
        file,
      });
      toast.success("Voice recorded successfully");
      setIsRecordOpen(false);
      setRecordedBlob(null);
      setVoiceName("");
      setVoiceDescription("");
      setRecordingTime(0);
    } catch {
      toast.error("Failed to save recording");
    }
  };

  const handleDelete = async () => {
    if (!deleteVoiceId) return;
    try {
      await deleteVoice.mutateAsync(deleteVoiceId);
      toast.success("Voice deleted");
    } catch {
      toast.error("Failed to delete voice");
    }
    setDeleteVoiceId(null);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Get authenticated audio URL
  const getVoiceAudioUrl = (voiceId: string) => {
    const token = useAuthStore.getState().token;
    return `${getApiBaseUrl()}/voices/${voiceId}/audio?token=${token}`;
  };

  // Download voice audio file
  const handleDownload = async (voiceId: string, voiceName: string) => {
    try {
      const url = getVoiceAudioUrl(voiceId);
      const response = await fetch(url);
      if (!response.ok) throw new Error("Download failed");
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `${voiceName}.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
    } catch {
      toast.error("Failed to download voice");
    }
  };

  if (!isChatterbox) {
    return (
      <div className="max-w-3xl">
        <h1 className="text-xl font-medium text-gray-600 dark:text-gray-400 mb-6">Custom Voices</h1>
        <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-6">
          <p className="text-amber-800 dark:text-amber-200">
            Custom voices are only available when using ChatterBox as your TTS provider.
          </p>
          <p className="text-amber-700 dark:text-amber-300 text-sm mt-2">
            Go to Settings and select "ChatterBox" as your TTS provider to enable custom voice cloning.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Spinner size="lg" />
        </div>
      ) : voices && voices.length > 0 ? (
        <>
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-medium text-gray-600 dark:text-gray-400">Custom Voices</h1>
            <div className="flex gap-2">
              <button
                onClick={() => setIsRecordOpen(true)}
                className={cn(buttonStyles.base, buttonStyles.secondary)}
              >
                <MicrophoneIcon className="w-4 h-4 mr-1.5" />
                Record
              </button>
              <button
                onClick={() => setIsUploadOpen(true)}
                className={cn(buttonStyles.base, buttonStyles.primary)}
              >
                <PlusIcon className="w-4 h-4 mr-1.5" />
                Upload
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {voices.map((voice) => (
              <div
                key={voice.id}
                className={cn(
                  "rounded-xl p-4",
                  "bg-white/50 dark:bg-white/5 backdrop-blur-xl",
                  "border border-white/50 dark:border-white/10",
                  "shadow-lg shadow-black/5 dark:shadow-none"
                )}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0 pr-2">
                    <h3 className="font-medium text-gray-900 dark:text-white truncate">{voice.name}</h3>
                    {voice.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                        {voice.description}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {new Date(voice.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 -mt-1 -mr-1 flex-shrink-0">
                    <button
                      onClick={() => handleDownload(voice.id, voice.name)}
                      className="text-gray-400 hover:text-indigo-500 p-1"
                      title="Download"
                    >
                      <ArrowDownTrayIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setDeleteVoiceId(voice.id)}
                      className="text-gray-400 hover:text-red-500 p-1"
                      title="Delete"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <AudioPlayer src={getVoiceAudioUrl(voice.id)} />
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
          <MicrophoneIcon className="w-16 h-16 text-gray-300 dark:text-gray-600" />
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
            No custom voices yet
          </h3>
          <p className="mt-2 text-gray-500 dark:text-gray-400 text-center max-w-sm">
            Upload an audio file or record your voice to create a custom voice for TTS.
          </p>
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => setIsRecordOpen(true)}
              className={cn(buttonStyles.base, buttonStyles.secondary)}
            >
              <MicrophoneIcon className="w-4 h-4 mr-1.5" />
              Record
            </button>
            <button
              onClick={() => setIsUploadOpen(true)}
              className={cn(buttonStyles.base, buttonStyles.primary)}
            >
              <PlusIcon className="w-4 h-4 mr-1.5" />
              Upload
            </button>
          </div>
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={isUploadOpen} onClose={() => setIsUploadOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl">
            <DialogTitle className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Upload Voice Sample
            </DialogTitle>

            <div
              {...getRootProps()}
              className={cn(
                "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors",
                isDragActive
                  ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                  : "border-gray-300 dark:border-gray-600 hover:border-gray-400"
              )}
            >
              <input {...getInputProps()} />
              {uploadFile ? (
                <p className="text-gray-900 dark:text-white">{uploadFile.name}</p>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">
                  Drop an audio file here, or click to select
                </p>
              )}
            </div>

            <div className="mt-4 space-y-3">
              <input
                type="text"
                placeholder="Voice name"
                value={voiceName}
                onChange={(e) => setVoiceName(e.target.value)}
                className={cn(
                  "w-full px-3 py-2 rounded-lg text-sm",
                  "bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10",
                  "text-gray-900 dark:text-white placeholder-gray-400",
                  "focus:outline-none focus:ring-2 focus:ring-indigo-500"
                )}
              />
              <textarea
                placeholder="Description (optional)"
                value={voiceDescription}
                onChange={(e) => setVoiceDescription(e.target.value)}
                rows={2}
                className={cn(
                  "w-full px-3 py-2 rounded-lg text-sm resize-none",
                  "bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10",
                  "text-gray-900 dark:text-white placeholder-gray-400",
                  "focus:outline-none focus:ring-2 focus:ring-indigo-500"
                )}
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setIsUploadOpen(false)}
                className={cn(buttonStyles.base, buttonStyles.secondary)}
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={!uploadFile || !voiceName.trim() || createVoice.isPending}
                className={cn(buttonStyles.base, buttonStyles.primary)}
              >
                {createVoice.isPending ? <Spinner size="sm" /> : "Upload"}
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>

      {/* Record Dialog */}
      <Dialog open={isRecordOpen} onClose={() => !isRecording && setIsRecordOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl">
            <DialogTitle className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Record Voice Sample
            </DialogTitle>

            <div className="text-center py-8">
              {isRecording ? (
                <div className="space-y-4">
                  <div className="w-20 h-20 mx-auto rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center animate-pulse">
                    <MicrophoneIcon className="w-10 h-10 text-red-500" />
                  </div>
                  <p className="text-2xl font-mono text-gray-900 dark:text-white">
                    {formatTime(recordingTime)}
                  </p>
                  <button
                    onClick={stopRecording}
                    className={cn(buttonStyles.base, "bg-red-500 hover:bg-red-600 text-white")}
                  >
                    Stop Recording
                  </button>
                </div>
              ) : recordedBlob ? (
                <div className="space-y-4">
                  <p className="text-gray-600 dark:text-gray-300">Recording complete!</p>
                  <audio controls src={URL.createObjectURL(recordedBlob)} className="mx-auto" />
                  <button
                    onClick={() => {
                      setRecordedBlob(null);
                      setRecordingTime(0);
                    }}
                    className={cn(buttonStyles.base, buttonStyles.secondary)}
                  >
                    Record Again
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="w-20 h-20 mx-auto rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    <MicrophoneIcon className="w-10 h-10 text-gray-400" />
                  </div>
                  <p className="text-gray-500 dark:text-gray-400">
                    Click to start recording your voice
                  </p>
                  <button
                    onClick={startRecording}
                    className={cn(buttonStyles.base, buttonStyles.primary)}
                  >
                    Start Recording
                  </button>
                </div>
              )}
            </div>

            {recordedBlob && (
              <div className="mt-4 space-y-3">
                <input
                  type="text"
                  placeholder="Voice name"
                  value={voiceName}
                  onChange={(e) => setVoiceName(e.target.value)}
                  className={cn(
                    "w-full px-3 py-2 rounded-lg text-sm",
                    "bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10",
                    "text-gray-900 dark:text-white placeholder-gray-400",
                    "focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  )}
                />
                <textarea
                  placeholder="Description (optional)"
                  value={voiceDescription}
                  onChange={(e) => setVoiceDescription(e.target.value)}
                  rows={2}
                  className={cn(
                    "w-full px-3 py-2 rounded-lg text-sm resize-none",
                    "bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10",
                    "text-gray-900 dark:text-white placeholder-gray-400",
                    "focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  )}
                />
              </div>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsRecordOpen(false);
                  setRecordedBlob(null);
                  setRecordingTime(0);
                }}
                disabled={isRecording}
                className={cn(buttonStyles.base, buttonStyles.secondary)}
              >
                Cancel
              </button>
              {recordedBlob && (
                <button
                  onClick={handleSaveRecording}
                  disabled={!voiceName.trim() || createVoice.isPending}
                  className={cn(buttonStyles.base, buttonStyles.primary)}
                >
                  {createVoice.isPending ? <Spinner size="sm" /> : "Save Voice"}
                </button>
              )}
            </div>
          </DialogPanel>
        </div>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteVoiceId}
        onClose={() => setDeleteVoiceId(null)}
        onConfirm={handleDelete}
        title="Delete Voice"
        message="Are you sure you want to delete this custom voice? This action cannot be undone."
        confirmLabel="Delete"
        isLoading={deleteVoice.isPending}
      />
    </div>
  );
}
