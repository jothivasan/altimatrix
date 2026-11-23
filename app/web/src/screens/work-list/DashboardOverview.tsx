import { Link } from '@tanstack/react-router'
import {
  Box,
  ClipboardCheck,
  Cpu,
  FileCode2,
  GitBranch,
  Inbox,
  Layers3,
  ListOrdered,
  Radio,
  ScanLine,
} from 'lucide-react'
import type { FilterKey } from './work-list.helpers'

const stages = [
  { label: 'Dispatch', icon: GitBranch, detail: 'Route incoming requests' },
  { label: 'Blueprint', icon: FileCode2, detail: 'Plan the change' },
  { label: 'Assembly', icon: Box, detail: 'Implement the plan' },
  { label: 'Inspection', icon: ScanLine, detail: 'Review the result' },
]

export function FactoryCapacity({
  running,
  capacity,
}: {
  running?: number
  capacity?: number
}) {
  return (
    <section className="capacity-panel">
      <div className="capacity-copy">
        <h2>
          <Cpu size={18} /> Machine capacity
        </h2>
        <div className="capacity-number">
          {running ?? '—'} <span>/ {capacity ?? '—'}</span>
        </div>
        <p>Run slots in use</p>
        <Link to="/queue" className="capacity-link">
          Open queue
        </Link>
      </div>
      <div className="chip-art" aria-hidden="true">
        <div className="chip-board">
          <div className="chip-socket" />
          <div className="chip-die">
            <Cpu strokeWidth={1.1} />
          </div>
        </div>
      </div>
    </section>
  )
}

export function WorkflowMap() {
  return (
    <section className="dash-panel workflow-map">
      <header className="panel-head">
        <h2>Factory pipeline</h2>
        <Link to="/workflow">Configure</Link>
      </header>
      <ol className="pipeline-stages">
        {stages.map(({ label, icon: Icon, detail }) => (
          <li key={label}>
            <span className="stage-node">
              <Icon size={20} />
            </span>
            <div>
              <strong>{label}</strong>
              <span className="stage-detail">{detail}</span>
            </div>
            {label === 'Dispatch' && <small>Optional</small>}
          </li>
        ))}
      </ol>
    </section>
  )
}

const metrics = [
  { key: 'all', label: 'Total work', icon: Layers3 },
  { key: 'running', label: 'Running', icon: Radio },
  { key: 'waiting', label: 'Waiting', icon: ListOrdered },
  { key: 'needsyou', label: 'Needs you', icon: Inbox },
] as const

export function WorkMetrics({
  count,
  filter,
  onSelect,
}: {
  count: (key: FilterKey) => number | undefined
  filter: FilterKey
  onSelect: (key: FilterKey) => void
}) {
  return (
    <div className="metric-grid">
      {metrics.map(({ key, label, icon: Icon }) => {
        const value = count(key)
        return (
          <button
            className="work-metric"
            data-metric={key}
            key={key}
            type="button"
            aria-pressed={filter === key}
            disabled={value === undefined}
            onClick={() => onSelect(key)}
          >
            <span className="metric-label">
              <span className="metric-icon">
                <Icon size={18} />
              </span>
              {label}
            </span>
            <span className="metric-amount">{value ?? '—'}</span>
          </button>
        )
      })}
    </div>
  )
}

export function WorkEmpty() {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed bg-muted/50 px-4 py-7 text-center">
      <ClipboardCheck className="mb-1 size-7 text-primary" strokeWidth={1.4} />
      <h3 className="font-heading font-semibold">No work yet</h3>
      <p className="max-w-[48ch] text-muted-foreground text-sm">
        Issues and pull requests from watched repositories appear here. Choose
        an item to start a run.
      </p>
      <Link
        to="/repos"
        className="mt-1 rounded-lg border bg-card px-3 py-1.5 font-medium text-primary text-sm hover:bg-accent"
      >
        Manage repositories
      </Link>
    </div>
  )
}
