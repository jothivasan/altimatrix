import { Link } from '@tanstack/react-router'
import type { RunStatus } from 'altimatrix/shared'
import { capacityLine, emptyQueueCopy, STATUS_TABS } from 'altimatrix/shared'
import { Cpu, Inbox, Layers, Pause, Play } from 'lucide-react'
import './queue.css'
import { useState } from 'react'
import { Screen } from '@/components/layout/Screen'
import { ErrorNote, Loading } from '@/components/state'
import {
  type QueueEntry,
  useDismissRun,
  usePauseQueue,
  useQueue,
  useQueueRun,
  useStartRun,
} from '@/modules/api/queue.hooks'
import { QueueRow, RowButton, StatusTabs } from './queue.components'

/**
 * Everything the factory has been asked to do, and how much of the machine it
 * may use doing it.
 *
 * The capacity meter is first because it is the screen's argument: this runs on
 * a laptop, so the number of things happening at once is small, visible, and
 * yours.
 */
export function Queue() {
  const [tab, setTab] = useState<RunStatus | 'all'>('all')
  const queue = useQueue()
  const start = useStartRun()
  const queueIt = useQueueRun()
  const dismiss = useDismissRun()
  const pause = usePauseQueue()

  if (queue.isPending) {
    return (
      <Screen title="Queue">
        <Loading rows={4} />
      </Screen>
    )
  }

  if (queue.isError) {
    return (
      <Screen title="Queue">
        <ErrorNote
          message={queue.error.message}
          onRetry={() => queue.refetch()}
        />
      </Screen>
    )
  }

  const { entries, running, capacity, paused } = queue.data
  // Offers belong to the inbox. Showing them here would make the queue look
  // full of work nobody asked for, which is the impression this screen exists
  // to undo.
  const inQueue = entries.filter((e) => e.status !== 'offered')
  const counts = countByStatus(inQueue)
  const shown =
    tab === 'all' ? inQueue : inQueue.filter((e) => e.status === tab)
  const queued = counts.queued ?? 0

  let position = 0

  return (
    <Screen title="Queue">
      <div className="queue-space">
        <WorkerStrip
          running={running}
          capacity={capacity}
          queued={queued}
          paused={paused}
          pending={pause.isPending}
          onToggle={() => pause.mutate({ paused: !paused })}
        />
        <div className="queue-desk">
          <StatusTabs
            tabs={STATUS_TABS}
            value={tab}
            counts={{ ...counts, all: inQueue.length }}
            onChange={setTab}
          />

          <section className="queue-results" aria-label="Run queue">
            <header className="queue-results-head">
              <h2>
                {tab === 'all'
                  ? 'All runs'
                  : STATUS_TABS.find((option) => option.key === tab)?.label}
              </h2>
              <span>
                {shown.length} {shown.length === 1 ? 'run' : 'runs'}
              </span>
            </header>
            {shown.length === 0 ? (
              <div className="queue-empty">
                <div className="queue-art" aria-hidden="true">
                  <div className="queue-sheet">
                    <Layers size={26} strokeWidth={1.5} />
                    <i />
                    <i />
                  </div>
                </div>
                <h3>
                  {tab === 'all' ? 'The queue is clear' : 'No matching runs'}
                </h3>
                <p>
                  {tab === 'all'
                    ? 'Choose an issue or pull request in the inbox to queue it for a worker.'
                    : emptyQueueCopy(tab)}
                </p>
                {tab === 'all' ? (
                  <Link to="/inbox" className="queue-empty-action">
                    <Inbox size={16} />
                    Open inbox
                  </Link>
                ) : (
                  <button
                    type="button"
                    className="queue-empty-action"
                    onClick={() => setTab('all')}
                  >
                    Show all runs
                  </button>
                )}
              </div>
            ) : (
              <div className="queue-records">
                {shown.map((entry) => {
                  if (entry.status === 'queued') {
                    position += 1
                  }
                  return (
                    <QueueRow
                      key={`${entry.repo}:${entry.kind}:${entry.number}`}
                      entry={entry}
                      position={entry.status === 'queued' ? position : null}
                      actions={
                        <Actions
                          entry={entry}
                          full={running >= capacity}
                          onStart={() => start.mutate(subjectOf(entry))}
                          onQueue={() => queueIt.mutate(subjectOf(entry))}
                          onDismiss={() => dismiss.mutate(subjectOf(entry))}
                        />
                      }
                    />
                  )
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </Screen>
  )
}

function WorkerStrip({
  running,
  capacity,
  queued,
  paused,
  pending,
  onToggle,
}: {
  running: number
  capacity: number
  queued: number
  paused: boolean
  pending: boolean
  onToggle: () => void
}) {
  return (
    <section className="worker-strip" aria-label="Worker capacity">
      <div className="worker-info">
        <span className="worker-icon">
          <Cpu size={25} />
        </span>
        <div>
          <h2>{paused ? 'Queue paused' : 'Queue active'}</h2>
          <p data-testid="capacity-sub">
            {capacityLine({ running, capacity, queued, paused })}
          </p>
        </div>
      </div>
      <div className="slot-readout">
        <strong data-testid="capacity-head">
          {running} / {capacity} slots busy
        </strong>
        <div className="slot-track" aria-hidden="true">
          {Array.from({ length: capacity }, (_, slot) => slot).map((slot) => (
            <i key={slot} data-busy={slot < running} />
          ))}
        </div>
      </div>
      <button
        type="button"
        className="queue-control"
        data-testid="pause-queue"
        disabled={pending}
        onClick={onToggle}
      >
        {paused ? <Play size={16} /> : <Pause size={16} />}{' '}
        {paused ? 'Resume queue' : 'Pause queue'}
      </button>
    </section>
  )
}

function Actions({
  entry,
  full,
  onStart,
  onQueue,
  onDismiss,
}: {
  entry: QueueEntry
  full: boolean
  onStart: () => void
  onQueue: () => void
  onDismiss: () => void
}) {
  if (entry.status === 'queued') {
    return (
      <>
        <RowButton primary disabled={full} onClick={onStart} testId="start-now">
          Start now
        </RowButton>
        <RowButton onClick={onDismiss} testId="remove">
          Remove
        </RowButton>
      </>
    )
  }
  if (entry.status === 'stopped' || entry.status === 'failed') {
    return (
      <RowButton primary onClick={onQueue} testId="queue-again">
        {entry.status === 'failed' ? 'Try again' : 'Queue again'}
      </RowButton>
    )
  }
  return null
}

function subjectOf(entry: QueueEntry) {
  return { repo: entry.repo, kind: entry.kind, number: entry.number }
}

function countByStatus(entries: readonly QueueEntry[]): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const entry of entries) {
    counts[entry.status] = (counts[entry.status] ?? 0) + 1
  }
  return counts
}
