import { useMutation, useQueryClient } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api';
import type { HttpRequest, Settings } from '../lib/models';
import { requestsQueryKey } from './useRequests';
import { settingsQueryKey } from './useSettings';

export function useUpdateSettings() {
  const queryClient = useQueryClient();

  return useMutation<void, unknown, Settings>({
    mutationFn: async (settings) => {
      await invoke('update_settings', { settings });
    },
    onMutate: async (settings) => {
      queryClient.setQueryData<Settings>(settingsQueryKey(), settings);
    },
  });
}