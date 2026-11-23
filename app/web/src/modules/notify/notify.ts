/**
 * Gates already announced, for the life of this process.
 *
 * Keyed on the gate rather than the event, because a run passes through several
 * stations and announcing per station is how people end up turning notifications
 * off. One gate, one notification.
 */
const announced = new Set<string>()

// Used to return to the latest gate when the dashboard becomes visible.
let lastAnnounced: { gateId: string; at: number } | undefined

/** The gate a click most plausibly meant, if it is recent enough to guess. */
export function recentlyAnnouncedGate(
  withinMs = 5 * 60_000,
): string | undefined {
  if (lastAnnounced === undefined) {
    return undefined
  }
  return Date.now() - lastAnnounced.at < withinMs
    ? lastAnnounced.gateId
    : undefined
}

async function allowed(): Promise<boolean> {
  if (typeof Notification === 'undefined') {
    return false
  }
  if (Notification.permission === 'granted') {
    return true
  }
  if (Notification.permission === 'denied') {
    return false
  }
  return (await Notification.requestPermission()) === 'granted'
}

export interface GateOpened {
  readonly gateId: string
  readonly repo: string
  readonly issue: number
  readonly summary?: string | undefined
}

export async function announceGate(gate: GateOpened): Promise<boolean> {
  if (announced.has(gate.gateId)) {
    return false
  }
  announced.add(gate.gateId)
  lastAnnounced = { gateId: gate.gateId, at: Date.now() }

  const title = `${gate.repo}#${gate.issue}`
  const body = gate.summary ?? 'A plan is waiting for your approval.'
  try {
    if (!(await allowed())) {
      return false
    }
    new Notification(title, { body, tag: gate.gateId })
    return true
  } catch {
    return false
  }
}
