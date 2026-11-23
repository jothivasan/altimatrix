import type { Database } from 'bun:sqlite'
import type { createAcpxProvider } from 'acpx-ai-provider'
import { and, eq } from 'drizzle-orm'
import { logger } from '@/lib/log'
import { query } from '@/modules/db/query'
import { workflowStageSessions } from '@/modules/db/schema/schema'

const log = logger('sessions')

/** The provider this module records ids from. */
export type Provider = ReturnType<typeof createAcpxProvider>

/**
 * The three ids acpx needs to pick a conversation back up.
 *
 * altimatrix stores the reference and nothing else. acpx keeps the session itself
 * under its own state directory, because owning another tool's layout means
 * inheriting it as a compatibility burden forever.
 */
export interface WorkflowStageSession {
  readonly sessionKey: string
  readonly acpxSessionId: string | null
  readonly acpxRecordId: string | null
  readonly agentSessionId: string | null
}

/**
 * The session key must name the station.
 *
 * A persistent session fixes its system prompt when it is created, and acpx
 * ignores a different one on reuse. Every station runs in the same worktree
 * with a different prompt, so one key per run would leak Blueprint's prompt
 * into Assembly's turn. The run is in the key too, so two issues being
 * worked at once cannot share a context.
 */
export function sessionKeyFor(runId: string, station: string): string {
  return `${runId}:${station}`
}

export function readWorkflowStageSession(
  db: Database,
  runId: string,
  station: string,
): WorkflowStageSession | undefined {
  return query(db)
    .select({
      sessionKey: workflowStageSessions.sessionKey,
      acpxSessionId: workflowStageSessions.acpxSessionId,
      acpxRecordId: workflowStageSessions.acpxRecordId,
      agentSessionId: workflowStageSessions.agentSessionId,
    })
    .from(workflowStageSessions)
    .where(
      and(
        eq(workflowStageSessions.runId, runId),
        eq(workflowStageSessions.station, station),
      ),
    )
    .get()
}

export function saveStationSession(
  db: Database,
  runId: string,
  station: string,
  session: WorkflowStageSession,
): void {
  const updatedAt = new Date().toISOString()
  query(db)
    .insert(workflowStageSessions)
    .values({ runId, station, ...session, updatedAt })
    .onConflictDoUpdate({
      target: [workflowStageSessions.runId, workflowStageSessions.station],
      set: { ...session, updatedAt },
    })
    .run()
}

/**
 * Records where a station's conversation got to, best effort.
 *
 * Swallowed on purpose: if the handle is not ready there is nothing worth
 * recording, and the next turn will try again. A failure to note a session id
 * must never fail a run that otherwise succeeded.
 */
export async function rememberSession(
  db: Database,
  provider: Provider,
  runId: string,
  station: string,
): Promise<void> {
  try {
    const { handle, sessionKey } = await provider.ensureHandle()
    const status = await provider.runtime.getStatus?.({ handle })
    saveStationSession(db, runId, station, {
      sessionKey,
      acpxSessionId: handle.runtimeSessionName ?? null,
      acpxRecordId: status?.acpxRecordId ?? handle.acpxRecordId ?? null,
      agentSessionId: status?.agentSessionId ?? handle.agentSessionId ?? null,
    })
  } catch (error) {
    log.debug('session ids not recorded', {
      runId,
      station,
      error: error instanceof Error ? error.message : String(error),
    })
  }
}
