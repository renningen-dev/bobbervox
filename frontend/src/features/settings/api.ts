import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api-client";
import type { AppSettings, UpdateSettingsRequest } from "../../types";

// Query keys
export const settingsKeys = {
  all: ["settings"] as const,
  detail: () => [...settingsKeys.all, "detail"] as const,
};

// Queries
export function useSettings() {
  return useQuery({
    queryKey: settingsKeys.detail(),
    queryFn: () => api.get<AppSettings>("/settings"),
  });
}

// Mutations
export function useUpdateSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateSettingsRequest) =>
      api.put<AppSettings>("/settings", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.all });
    },
  });
}
