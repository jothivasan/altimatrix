import type { ReactNode } from 'react'

export function Screen({
  title,
  sub,
  actions,
  children,
}: {
  title: string
  sub?: string
  actions?: ReactNode
  children: ReactNode
}) {
  return (
    <>
      {sub ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-heading font-semibold text-lg [overflow-wrap:anywhere]">
              {title}
            </h1>
            <p className="text-muted-foreground text-sm [overflow-wrap:anywhere]">
              {sub}
            </p>
          </div>
          {actions}
        </div>
      ) : (
        <>
          <h1 className="sr-only">{title}</h1>
          {actions && <div className="mb-3 flex justify-end">{actions}</div>}
        </>
      )}
      {children}
    </>
  )
}

export function GroupHead({ label, count }: { label: string; count?: number }) {
  return (
    <div className="mb-3 flex items-center gap-2 font-heading font-semibold text-lg">
      {label}
      {count === undefined ? null : (
        <span className="text-foreground">{count}</span>
      )}
    </div>
  )
}
