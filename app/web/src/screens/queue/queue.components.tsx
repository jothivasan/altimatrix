import type { RunStatus } from 'altimatrix/shared'
import { statusLabel } from 'altimatrix/shared'
import {
  Activity,
  CircleAlert,
  CircleCheck,
  CircleStop,
  Clock3,
  Hand,
  Layers,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { QueueEntry } from '@/modules/api/queue.hooks'

const FILTER_ICONS = {
  all: Layers,
  running: Activity,
  queued: Clock3,
  blocked: Hand,
  stopped: CircleStop,
  delivered: CircleCheck,
  failed: CircleAlert,
}

export function StatusTabs({
  tabs,
  value,
  counts,
  onChange,
}: {
  tabs: readonly { key: RunStatus | 'all'; label: string }[]
  value: RunStatus | 'all'
  counts: Record<string, number>
  onChange: (next: RunStatus | 'all') => void
}) {
  return (
    <fieldset className="queue-filters">
      <legend className="sr-only">Filter runs by status</legend>
      <span aria-hidden="true" className="queue-filter-label">
        Run status
      </span>
      {tabs.map((tab) => {
        const Icon =
          FILTER_ICONS[tab.key as keyof typeof FILTER_ICONS] ?? Layers
        return (
          <button
            type="button"
            key={tab.key}
            aria-pressed={value === tab.key}
            data-testid={`tab-${tab.key}`}
            onClick={() => onChange(tab.key)}
          >
            <Icon size={17} />
            {tab.label}
            <span>{counts[tab.key] ?? 0}</span>
          </button>
        )
      })}
    </fieldset>
  )
}

const DOT: Record<RunStatus, string> = {
  offered: 'bg-muted-foreground/60',
  queued: 'bg-muted-foreground',
  running: 'bg-chart-2',
  blocked: 'bg-chart-1',
  stopped: 'bg-muted-foreground/60',
  delivered: 'bg-chart-2',
  failed: 'bg-destructive',
  skipped: 'bg-muted-foreground/40',
}

export function QueueRow({
  entry,
  position,
  actions,
}: {
  entry: QueueEntry
  position: number | null
  actions: React.ReactNode
}) {
  return (
    <div
      data-testid="queue-row"
      data-status={entry.status}
      className="queue-record"
    >
      {position === null ? null : (
        <span className="w-5 shrink-0 text-right text-[11px] text-muted-foreground tabular-nums">
          {position}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <strong className="block text-base [overflow-wrap:anywhere]">
          {entry.title ??
            `${entry.kind === 'pr' ? 'PR' : 'Issue'} #${entry.number}`}
        </strong>
        <span className="mt-1 block text-muted-foreground text-sm [overflow-wrap:anywhere]">
          {entry.repo} · {entry.kind === 'pr' ? 'PR' : 'issue'} #{entry.number}
        </span>
        {entry.error === null ? null : (
          <span className="mt-0.5 block truncate text-[11.5px] text-destructive">
            {entry.error}
          </span>
        )}
      </span>
      <span className="queue-record-status">
        <i className={DOT[entry.status]} />
        {statusLabel(entry.status)}
      </span>
      <span className="queue-record-actions">{actions}</span>
    </div>
  )
}

export function RowButton({
  children,
  onClick,
  primary,
  disabled,
  testId,
}: {
  children: React.ReactNode
  onClick: () => void
  primary?: boolean
  disabled?: boolean
  testId?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      data-testid={testId}
      className={cn(
        'min-h-9 rounded-lg px-3 text-sm transition-colors disabled:opacity-40',
        primary
          ? 'bg-primary font-semibold text-primary-foreground hover:opacity-90'
          : 'border border-border text-muted-foreground hover:bg-muted hover:text-foreground',
      )}
    >
      {children}
    </button>
  )
}
