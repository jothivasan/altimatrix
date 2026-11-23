/**
 * The four workflow stages and their dashboard labels.
 *
 * The sentences are the contract a person reads before changing anything: what
 * the station does, and what it cannot do however it is configured. They live
 * beside the names rather than in the screen because they describe the run,
 * not the page.
 */

// Stable identifiers used by saved runs, settings, and the event API.
export const WORKFLOW_STAGE_IDS = [
  'classifier',
  'analyst',
  'implementer',
  'reviewer',
] as const

export type WorkflowStageId = (typeof WORKFLOW_STAGE_IDS)[number]

export interface WorkflowStageInfo {
  readonly name: WorkflowStageId
  readonly title: string
  readonly sentence: string
  /** Whether a person may choose which agent drives it. */
  readonly configurableAgent: boolean
}

export const WORKFLOW_STAGES: readonly WorkflowStageInfo[] = [
  {
    name: 'classifier',
    title: 'Dispatch',
    sentence:
      'Decides what an issue actually is before anyone acts on it. Writes nothing to the repository.',
    configurableAgent: false,
  },
  {
    name: 'analyst',
    title: 'Blueprint',
    sentence:
      'Reads the repository and prepares the plan, acceptance criteria, and test strategy.',
    configurableAgent: true,
  },
  {
    name: 'implementer',
    title: 'Assembly',
    sentence: 'Writes the code against the plan and runs the relevant checks.',
    configurableAgent: true,
  },
  {
    name: 'reviewer',
    title: 'Inspection',
    sentence:
      'Checks the committed changes against the acceptance criteria before delivery.',
    configurableAgent: true,
  },
]

const stageTitles = new Map<string, string>([
  ...WORKFLOW_STAGES.map(({ name, title }) => [name, title] as const),
  ['workspace', 'Workspace'],
  ['deliver', 'Publish'],
])

/** The display label for a workflow stage or a system step in the run log. */
export function workflowStageName(id: string): string {
  return stageTitles.get(id) ?? id
}

export const REASONING_EFFORTS = ['low', 'medium', 'high', 'xhigh'] as const
export type ReasoningEffort = (typeof REASONING_EFFORTS)[number]
