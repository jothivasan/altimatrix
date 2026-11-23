import { logger } from '@/lib/log'
import { parseStationOutput } from '@/lib/structured'
import { toolSurfaceIsUp } from '@/modules/tools/endpoint'
import { runWorkflowStage, type WorkflowStageResult } from '@/run/workflowStage'

const log = logger('stations')

class WorkflowStageOutputError extends Error {
  constructor(station: string, detail: string) {
    super(
      `the ${station} returned output that does not match its schema: ${detail}`,
    )
    this.name = 'WorkflowStageOutputError'
  }
}

/**
 * A station whose turn has to produce a structured value.
 *
 * A tool call is the first choice: it was validated on the way in and recorded
 * on disk, so there is nothing to parse and nothing to disagree about. Parsing
 * the reply is the fallback, for the headless path and for a turn where the
 * tool surface did not come up. The retry asks for whichever of the two that
 * turn was told to use.
 */
export async function runStructuredStage<T>(
  station: string,
  input: Parameters<typeof runWorkflowStage>[0],
  schema: Parameters<typeof parseStationOutput<T>>[1],
  fromTools: (result: WorkflowStageResult) => T | undefined,
): Promise<{ value: T; result: WorkflowStageResult }> {
  let result = await runWorkflowStage(input)
  let recorded = fromTools(result)
  if (recorded !== undefined) {
    return { value: recorded, result }
  }

  let parsed = parseStationOutput(result.text, schema)
  if (!parsed.ok) {
    log.warn(`${station} recorded nothing usable, retrying once`, {
      error: parsed.error,
      hadTools: toolSurfaceIsUp(),
    })
    result = await runWorkflowStage({
      ...input,
      task: `${input.task}\n\nYour previous reply recorded nothing usable: ${parsed.error}. Do it again with the same content, recording it the way you were asked to above.`,
    })
    recorded = fromTools(result)
    if (recorded !== undefined) {
      return { value: recorded, result }
    }
    parsed = parseStationOutput(result.text, schema)
  }
  if (!parsed.ok) {
    throw new WorkflowStageOutputError(station, parsed.error)
  }
  return { value: parsed.value, result }
}
