import type { InferResponseType } from 'hono/client'
import { createQuery } from 'react-query-kit'
import { api } from '@/modules/api/client'
import { parseResponse } from '@/modules/api/parse'

type Client = typeof api
type RunsResponse = InferResponseType<Client['runs']['$get']>

export const usePastRuns = createQuery<RunsResponse>({
  queryKey: ['runs'],
  // The factory claims and finishes runs on its own schedule, so an open
  // window has to ask. This is the floor until the event stream is wired in
  // to invalidate on the transitions that matter.
  refetchInterval: 5000,
  refetchOnWindowFocus: true,
  fetcher: async () => {
    return parseResponse<RunsResponse>(await api.runs.$get())
  },
})

type LiveResponse = InferResponseType<Client['live'][':runId']['$get']>

type ActiveResponse = InferResponseType<Client['live']['$get']>

/**
 * Which runs still have their events in memory.
 *
 * The history table knows a run happened; only the buffer knows what it said,
 * and it is keyed by a run id the table does not carry. This is what lets a
 * row in the list point at its own detail.
 */
export const useActiveRuns = createQuery<ActiveResponse>({
  queryKey: ['live', 'active'],
  fetcher: async () => {
    return parseResponse<ActiveResponse>(await api.live.$get())
  },
})

interface RunVars {
  readonly runId: string
}

/**
 * Everything one run has said, newest last.
 *
 * Read from the event buffer rather than the database, because what a run is
 * doing right now only exists there: the database holds how it ended.
 */
export const useRunEvents = createQuery<LiveResponse, RunVars>({
  queryKey: ['live'],
  fetcher: async ({ runId }) => {
    return parseResponse<LiveResponse>(
      // Encoded for the same reason a gate id is: the client inserts a path
      // parameter verbatim and a run id carries a slash.
      await api.live[':runId'].$get({
        param: { runId: encodeURIComponent(runId) },
      }),
    )
  },
})
