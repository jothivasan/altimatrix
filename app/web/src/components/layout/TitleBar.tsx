import { PanelLeft, Radio } from 'lucide-react'
import { AnimatedSidebarTrigger } from '@/components/motion/animated-sidebar'
import type { StreamState } from '@/modules/api/events'

export function TitleBar({
  crumb,
  stream,
}: {
  crumb: string
  stream: StreamState
}) {
  const status = {
    live: 'Factory online',
    lost: 'Factory unreachable',
    connecting: 'Connecting',
  }
  return (
    <header className="flex min-h-12 shrink-0 items-center gap-2 border-b bg-card px-3 md:px-5">
      <AnimatedSidebarTrigger className="size-11 shrink-0 text-muted-foreground">
        <PanelLeft className="size-4" />
      </AnimatedSidebarTrigger>
      <span className="min-w-0 truncate text-muted-foreground text-sm capitalize">
        {crumb}
      </span>
      <span className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-full border bg-muted px-2.5 py-1 text-xs">
        <Radio aria-hidden className="size-3.5" />
        {status[stream]}
      </span>
    </header>
  )
}
