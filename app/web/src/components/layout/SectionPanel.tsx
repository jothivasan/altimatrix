import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

export function SectionPanel({
  title,
  icon: Icon,
  count,
  tone = 'fern',
  children,
}: {
  title: string
  icon: LucideIcon
  count?: number
  tone?: 'fern' | 'blue' | 'clay'
  children: ReactNode
}) {
  return (
    <section className="section-panel" data-tone={tone}>
      <header className="section-panel-head">
        <span className="section-icon">
          <Icon size={21} strokeWidth={1.7} />
        </span>
        <h2>{title}</h2>
        {count !== undefined && <span className="section-count">{count}</span>}
      </header>
      <div className="section-panel-body">{children}</div>
    </section>
  )
}

export function QuietState({
  icon: Icon,
  title,
  children,
  action,
}: {
  icon: LucideIcon
  title: string
  children: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="quiet-state">
      <div className="quiet-art" aria-hidden="true">
        <span>
          <Icon size={31} strokeWidth={1.45} />
        </span>
      </div>
      <h3>{title}</h3>
      <p>{children}</p>
      {action}
    </div>
  )
}
