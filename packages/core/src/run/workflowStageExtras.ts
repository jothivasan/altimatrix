import type { Config } from '@/config'
import type { WorkflowStageId } from '@/events/events.types'

/**
 * What one station was given, appended to every turn it takes.
 *
 * Added here rather than inside each prompt builder. There are eight builders
 * across the four stations, and a station's turns are not only the first one:
 * Blueprint answers at the plan gate, Assembly fixes CI, Inspection
 * looks at a fault. Threading this through each of them is an invitation to
 * miss one, and a skill that vanishes on the second turn is worse than one
 * that was never set.
 *
 * Every station turn goes through `runWorkflowStage`, so this is applied in exactly
 * one place and cannot be omitted from a path somebody adds later.
 */

export interface StationExtras {
  readonly skills: readonly string[]
  readonly instructions: string
}

export function workflowStageExtras(station?: StationExtras): string {
  if (station === undefined) {
    return ''
  }
  const parts: string[] = []
  if (station.skills.length > 0) {
    parts.push(
      `Skills available to you for this work: ${station.skills.join(', ')}. These were given to this station and not to the others, so do not assume another station has them.`,
    )
  }
  const written = station.instructions.trim()
  if (written !== '') {
    parts.push(written)
  }
  return parts.length === 0 ? '' : `\n\n${parts.join('\n\n')}`
}

/**
 * The reasoning effort this station runs at.
 *
 * Its own when it has one, the shared setting otherwise. Absent rather than
 * defaulted per station, so an unset station follows the shared value instead
 * of being pinned to whatever the default happened to be.
 */
export function effortFor(config: Config, station: WorkflowStageId): string {
  return config.stations[station].reasoningEffort ?? config.reasoningEffort
}
