import { Link, useNavigate } from '@tanstack/react-router'
import { LANE_COPY, type Lane as LaneKey } from 'altimatrix/shared'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { Screen } from '@/components/layout/Screen'
import { useToast } from '@/components/providers/ToastProvider'
import { ErrorNote } from '@/components/state'
import { useStartRun } from '@/modules/api/queue.hooks'
import { useWork, type WorkItem } from '@/modules/api/work.hooks'
import {
  FactoryCapacity,
  WorkEmpty,
  WorkflowMap,
  WorkMetrics,
} from './DashboardOverview'
import { Filters, Lane, RowSkeleton, WorkRow } from './work-list.components'
import {
  countFor,
  FILTERS,
  type FilterKey,
  lanesFor,
} from './work-list.helpers'
import { useLiveRows } from './work-list.hooks'

/**
 * Everything in play, as one list.
 *
 * The unit is the piece of work rather than the run, because a person
 * describing a feature and a poller finding an issue produce the same thing
 * and following it should not mean three screens.
 */
export function WorkList() {
  const [filter, setFilter] = useState<FilterKey>('all')
  const [closed, setClosed] = useState<ReadonlySet<string>>(new Set())
  const work = useWork({ variables: {} })
  const toast = useToast()
  const start = useStartRun({
    onError: (error) => toast.failed('Could not start that work', error),
  })
  const navigate = useNavigate()
  const rows = useLiveRows()

  const data = work.data
  const keep = lanesFor(filter)
  const shown = (data?.lanes ?? []).filter(
    (lane) =>
      (keep === null || keep.includes(lane.key)) &&
      (lane.items.length > 0 || keep !== null),
  )

  return (
    <Screen
      title="Factory overview"
      actions={
        <Link to="/work/new" className="new-work-action">
          <Plus size={18} /> New work
        </Link>
      }
    >
      <div className="overview-grid">
        <FactoryCapacity running={data?.running} capacity={data?.capacity} />
        <WorkMetrics
          filter={filter}
          onSelect={setFilter}
          count={(key) =>
            data ? countFor(key, data.counts, data.total) : undefined
          }
        />
      </div>
      <div className="operations-grid">
        <section className="dash-panel activity-panel">
          <header className="panel-head">
            <h2>Work activity</h2>
          </header>
          {work.isError && (
            <ErrorNote
              message={work.error?.message ?? 'No response'}
              onRetry={() => work.refetch()}
            />
          )}
          {work.isPending && (
            <div className="grid gap-2">
              <RowSkeleton />
              <RowSkeleton />
            </div>
          )}
          {data && (
            <>
              <Filters
                value={filter}
                onSelect={(key) => setFilter(key as FilterKey)}
                options={FILTERS.map((option) => ({
                  key: option.key,
                  label: option.label,
                  count: countFor(option.key, data.counts, data.total),
                }))}
              />

              {shown.length === 0 ? <WorkEmpty /> : null}

              {shown.map((lane) => (
                <Lane
                  key={lane.key}
                  lane={lane.key}
                  count={lane.items.length}
                  open={!closed.has(lane.key)}
                  onToggle={() => setClosed(toggle(closed, lane.key))}
                >
                  {lane.items.length === 0 ? (
                    <p className="rounded-[var(--radius)] border border-border border-dashed bg-sidebar px-4 py-6 text-center text-[13px] text-muted-foreground">
                      {LANE_COPY[lane.key].empty}
                    </p>
                  ) : (
                    lane.items.map((item) => {
                      const activity = rows(item)
                      return (
                        <WorkRow
                          key={item.id}
                          item={item}
                          onOpen={() => openWork(item, navigate)}
                          {...startProps(item, start)}
                          {...(activity === null ? {} : { activity })}
                        />
                      )
                    })
                  )}
                </Lane>
              ))}
            </>
          )}
        </section>
        <WorkflowMap />
      </div>
    </Screen>
  )
}

/**
 * A row that has never run gets a Start button, and nothing else does.
 *
 * This is the queue made visible: Altimatrix finds work on GitHub and does nothing
 * with it until a person says so.
 */
function startProps(
  item: WorkItem,
  start: ReturnType<typeof useStartRun>,
): { onStart?: () => void; starting?: boolean } {
  if (item.lane !== 'offered') {
    return {}
  }
  const subject = { repo: item.repo, kind: item.kind, number: item.number }
  // Kind is part of the match because an issue and a pull request may share a
  // number in one repository, and without it starting either one puts both
  // rows into the pending state.
  const mine =
    start.variables?.repo === item.repo &&
    start.variables?.kind === item.kind &&
    start.variables?.number === item.number
  return {
    onStart: () => start.mutate(subject),
    starting: start.isPending && mine,
  }
}

/** Every row opens its own thread now that there is one. */
function openWork(
  item: WorkItem,
  navigate: ReturnType<typeof useNavigate>,
): void {
  void navigate({ to: '/work/$workId', params: { workId: item.id } })
}

function toggle(set: ReadonlySet<string>, key: LaneKey): ReadonlySet<string> {
  const next = new Set(set)
  if (!next.delete(key)) {
    next.add(key)
  }
  return next
}
