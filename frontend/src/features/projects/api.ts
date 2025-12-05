import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api-client";
import type {
  CreateProjectRequest,
  Project,
  ProjectListItem,
  ProjectWithSegments,
} from "../../types";

// Query keys
export const projectKeys = {
  all: ["projects"] as const,
  lists: () => [...projectKeys.all, "list"] as const,
  list: () => [...projectKeys.lists()] as const,
  details: () => [...projectKeys.all, "detail"] as const,
  detail: (id: string) => [...projectKeys.details(), id] as const,
};

// Queries
export function useProjects() {
  return useQuery({
    queryKey: projectKeys.list(),
    queryFn: () => api.get<ProjectListItem[]>("/projects"),
  });
}

export function useProject(id: string, options?: { refetchInterval?: number | false }) {
  return useQuery({
    queryKey: projectKeys.detail(id),
    queryFn: () => api.get<ProjectWithSegments>(`/projects/${id}`),
    enabled: !!id,
    refetchInterval: options?.refetchInterval,
  });
}

// Mutations
export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProjectRequest) =>
      api.post<Project>("/projects", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete(`/projects/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
}

export function useUploadVideo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, file }: { projectId: string; file: File }) =>
      api.upload<Project>(`/projects/${projectId}/upload`, file),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: projectKeys.detail(data.id),
      });
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
}

export function useExtractAudio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectId: string) =>
      api.post<Project>(`/projects/${projectId}/extract-audio`),
    onSuccess: (_data, projectId) => {
      queryClient.invalidateQueries({
        queryKey: projectKeys.detail(projectId),
      });
    },
  });
}
