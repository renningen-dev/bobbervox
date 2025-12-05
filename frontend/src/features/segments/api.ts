import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api-client";
import { projectKeys } from "../projects/api";
import type {
  CreateSegmentRequest,
  Segment,
  TTSRequest,
  UpdateAnalysisRequest,
  UpdateTranslationRequest,
} from "../../types";

// Query keys
export const segmentKeys = {
  all: ["segments"] as const,
  lists: () => [...segmentKeys.all, "list"] as const,
  list: (projectId: string) => [...segmentKeys.lists(), projectId] as const,
  details: () => [...segmentKeys.all, "detail"] as const,
  detail: (id: string) => [...segmentKeys.details(), id] as const,
};

// Queries
export function useSegments(projectId: string) {
  return useQuery({
    queryKey: segmentKeys.list(projectId),
    queryFn: () => api.get<Segment[]>(`/projects/${projectId}/segments`),
    enabled: !!projectId,
  });
}

export function useSegment(id: string) {
  return useQuery({
    queryKey: segmentKeys.detail(id),
    queryFn: () => api.get<Segment>(`/segments/${id}`),
    enabled: !!id,
  });
}

// Mutations
export function useCreateSegment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      projectId,
      data,
    }: {
      projectId: string;
      data: CreateSegmentRequest;
    }) => api.post<Segment>(`/projects/${projectId}/segments`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: segmentKeys.list(variables.projectId),
      });
      // Also invalidate project details since it includes segments
      queryClient.invalidateQueries({
        queryKey: projectKeys.detail(variables.projectId),
      });
    },
  });
}

export function useDeleteSegment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      segmentId,
    }: {
      segmentId: string;
      projectId: string;
    }) => api.delete(`/segments/${segmentId}`),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: segmentKeys.list(variables.projectId),
      });
      queryClient.invalidateQueries({
        queryKey: projectKeys.detail(variables.projectId),
      });
    },
  });
}

export function useExtractSegment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (segmentId: string) =>
      api.post<Segment>(`/segments/${segmentId}/extract`),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: segmentKeys.detail(data.id),
      });
      queryClient.invalidateQueries({
        queryKey: segmentKeys.list(data.project_id),
      });
    },
  });
}

export function useAnalyzeSegment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (segmentId: string) =>
      api.post<Segment>(`/segments/${segmentId}/analyze`),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: segmentKeys.detail(data.id),
      });
      queryClient.invalidateQueries({
        queryKey: segmentKeys.list(data.project_id),
      });
      // Also invalidate project details since it includes segments
      queryClient.invalidateQueries({
        queryKey: projectKeys.detail(data.project_id),
      });
    },
  });
}

export function useGenerateTTS() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      segmentId,
      data,
    }: {
      segmentId: string;
      data: TTSRequest;
    }) => api.post<Segment>(`/segments/${segmentId}/generate-tts`, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: segmentKeys.detail(data.id),
      });
      queryClient.invalidateQueries({
        queryKey: segmentKeys.list(data.project_id),
      });
      // Also invalidate project details since it includes segments
      queryClient.invalidateQueries({
        queryKey: projectKeys.detail(data.project_id),
      });
    },
  });
}

export function useUpdateTranslation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      segmentId,
      data,
    }: {
      segmentId: string;
      data: UpdateTranslationRequest;
    }) => api.put<Segment>(`/segments/${segmentId}/translation`, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: segmentKeys.detail(data.id),
      });
      queryClient.invalidateQueries({
        queryKey: segmentKeys.list(data.project_id),
      });
      // Also invalidate project details since it includes segments
      queryClient.invalidateQueries({
        queryKey: projectKeys.detail(data.project_id),
      });
    },
  });
}

export function useUpdateAnalysis() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      segmentId,
      data,
    }: {
      segmentId: string;
      data: UpdateAnalysisRequest;
    }) => api.put<Segment>(`/segments/${segmentId}/analysis`, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: segmentKeys.detail(data.id),
      });
      queryClient.invalidateQueries({
        queryKey: segmentKeys.list(data.project_id),
      });
      // Also invalidate project details since it includes segments
      queryClient.invalidateQueries({
        queryKey: projectKeys.detail(data.project_id),
      });
    },
  });
}
