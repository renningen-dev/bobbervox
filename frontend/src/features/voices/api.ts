import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api-client";
import type { CustomVoice, UpdateCustomVoiceRequest } from "../../types";

// Query keys
export const voicesKeys = {
  all: ["voices"] as const,
  list: () => [...voicesKeys.all, "list"] as const,
  detail: (id: string) => [...voicesKeys.all, "detail", id] as const,
};

// Queries
export function useCustomVoices() {
  return useQuery({
    queryKey: voicesKeys.list(),
    queryFn: () => api.get<CustomVoice[]>("/voices"),
  });
}

export function useCustomVoice(id: string) {
  return useQuery({
    queryKey: voicesKeys.detail(id),
    queryFn: () => api.get<CustomVoice>(`/voices/${id}`),
    enabled: !!id,
  });
}

// Mutations
export function useCreateCustomVoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; description?: string; file: File }) => {
      const formData = new FormData();
      formData.append("file", data.file);
      formData.append("name", data.name);
      if (data.description) {
        formData.append("description", data.description);
      }
      return api.postFormData<CustomVoice>("/voices", formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: voicesKeys.all });
    },
  });
}

export function useUpdateCustomVoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ voiceId, data }: { voiceId: string; data: UpdateCustomVoiceRequest }) =>
      api.patch<CustomVoice>(`/voices/${voiceId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: voicesKeys.all });
    },
  });
}

export function useDeleteCustomVoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (voiceId: string) => api.delete(`/voices/${voiceId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: voicesKeys.all });
    },
  });
}

// Get audio URL for a custom voice
export function getCustomVoiceAudioUrl(voiceId: string): string {
  return `${import.meta.env.VITE_API_URL || "http://localhost:8000/api"}/voices/${voiceId}/audio`;
}
