import type { InferRequestType, InferResponseType } from 'hono/client'
import { createMutation, createQuery } from 'react-query-kit'
import { api } from '@/modules/api/client'
import { parseResponse } from '@/modules/api/parse'
import { queryClient } from '@/modules/api/queryClient'

type Client = typeof api
type SettingsResponse = InferResponseType<Client['settings']['$get']>
type SettingsPatch = InferRequestType<Client['settings']['$patch']>['json']

export const useSettings = createQuery<SettingsResponse>({
  queryKey: ['settings'],
  fetcher: async () => {
    return parseResponse<SettingsResponse>(await api.settings.$get())
  },
})

/**
 * Changes one setting without restating the rest.
 *
 * The route takes a partial for a reason: two windows open on settings would
 * otherwise overwrite each other's unrelated edits every time either saved.
 */
export const useSaveSettings = createMutation<SettingsResponse, SettingsPatch>({
  mutationFn: async (patch) => {
    return parseResponse<SettingsResponse>(
      await api.settings.$patch({ json: patch }),
    )
  },
  onSettled: () => {
    void queryClient.invalidateQueries({ queryKey: useSettings.getKey() })
  },
})
