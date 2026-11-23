import type { Config } from '@/config'
import type { GhIssue } from '@/lib/gh'
import { toolSurfaceIsUp } from '@/modules/tools/endpoint'
import {
  buildAssemblyPrompt,
  buildBlueprintPrompt,
  buildDispatchPrompt,
  buildInspectionPrompt,
  buildReplyPrompt,
  buildWorkflowStageRules,
} from '@/prompts/workflowStages'
import { runWorkflowStage, type WorkflowStageResult } from '@/run/workflowStage'
import {
  type Analysis,
  analysisSchema,
  type Review,
  reviewSchema,
  type Triage,
  triageSchema,
} from '@/run/workflowStages/schemas'
import { runStructuredStage } from '@/run/workflowStages/structured'

/**
 * Runs a station and validates its structured output, retrying once.
 *
 * The retry exists because a station both works and reports, and an agent that
 * revised itself mid-reply occasionally leaves the JSON malformed. One
 * clarified retry is cheap; a second would just be a slower way to fail.
 */

export interface BlueprintInput {
  readonly runId: string
  readonly repo: string
  readonly issue: GhIssue
  readonly worktree: string
  readonly conventionFiles: readonly string[]
  readonly config: Config
  /** Whether to lead with the open questions rather than with an answer. */
  readonly asksFirst?: boolean
  /** Cancels the turn when the run it belongs to stops. */
  readonly signal?: AbortSignal
}

/** Plans the change and writes the acceptance criteria. Modifies nothing. */
export async function runBlueprint(
  input: BlueprintInput,
): Promise<{ analysis: Analysis; result: WorkflowStageResult }> {
  const { value, result } = await runStructuredStage(
    'analyst',
    {
      agent: input.config.agents.analyst,
      runId: input.runId,
      station: 'analyst',
      ...(input.signal === undefined ? {} : { signal: input.signal }),
      subject: { repo: input.repo, kind: 'issue', number: input.issue.number },
      title: input.issue.title,
      label: 'blueprint',
      worktree: input.worktree,
      systemRules: buildWorkflowStageRules('analyst'),
      task: buildBlueprintPrompt({
        repo: input.repo,
        issue: input.issue,
        conventionFiles: input.conventionFiles,
        tools: toolSurfaceIsUp(),
        ...(input.asksFirst === undefined
          ? {}
          : { asksFirst: input.asksFirst }),
      }),
      // Reads only. The planning station cannot modify the repository it is
      // planning against, which is a property of the run rather than a promise.
      permission: 'approve-reads',
      config: input.config,
    },
    analysisSchema,
    (result) => result.recorded.analysis,
  )
  return { analysis: value, result }
}

export interface AssemblyInput {
  readonly runId: string
  readonly repo: string
  readonly issue: GhIssue
  readonly worktree: string
  readonly analysis: Analysis
  readonly conventionFiles: readonly string[]
  readonly revision?: { readonly review: Review; readonly attempt: number }
  readonly config: Config
  /** Cancels the turn when the run it belongs to stops. */
  readonly signal?: AbortSignal
}

/** Writes the code against the plan. The only station that may modify files. */
export async function runAssembly(
  input: AssemblyInput,
): Promise<WorkflowStageResult> {
  return runWorkflowStage({
    agent: input.config.agents.implementer,
    runId: input.runId,
    station: 'implementer',
    ...(input.signal === undefined ? {} : { signal: input.signal }),
    subject: { repo: input.repo, kind: 'issue', number: input.issue.number },
    title: input.issue.title,
    label: 'assembly',
    worktree: input.worktree,
    systemRules: buildWorkflowStageRules('implementer'),
    task: buildAssemblyPrompt({
      repo: input.repo,
      issue: input.issue,
      analysis: input.analysis,
      conventionFiles: input.conventionFiles,
      revision: input.revision,
    }),
    permission: 'approve-all',
    config: input.config,
  })
}

export interface InspectionInput {
  readonly runId: string
  readonly repo: string
  readonly issue: GhIssue
  /** An independent checkout of the branch, not Assembly's worktree. */
  readonly worktree: string
  readonly analysis: Analysis
  readonly base: string
  readonly branch: string
  readonly config: Config
  /** Cancels the turn when the run it belongs to stops. */
  readonly signal?: AbortSignal
}

/** Judges the real diff against the criteria. Modifies nothing. */
export async function runInspection(
  input: InspectionInput,
): Promise<{ review: Review; result: WorkflowStageResult }> {
  const { value, result } = await runStructuredStage(
    'reviewer',
    {
      agent: input.config.agents.reviewer,
      runId: input.runId,
      station: 'reviewer',
      ...(input.signal === undefined ? {} : { signal: input.signal }),
      subject: { repo: input.repo, kind: 'issue', number: input.issue.number },
      title: input.issue.title,
      label: 'inspection',
      worktree: input.worktree,
      systemRules: buildWorkflowStageRules('reviewer'),
      task: buildInspectionPrompt({
        repo: input.repo,
        issue: input.issue,
        analysis: input.analysis,
        base: input.base,
        branch: input.branch,
        tools: toolSurfaceIsUp(),
      }),
      permission: 'approve-reads',
      config: input.config,
    },
    reviewSchema,
    (result) => result.recorded.review,
  )
  return { review: value, result }
}

export interface BlueprintReplyInput {
  readonly runId: string
  readonly repo: string
  readonly issueNumber: number
  readonly worktree: string
  readonly question: string
  readonly history: readonly { author: string; role: string; body: string }[]
  readonly config: Config
  readonly signal?: AbortSignal
}

export interface BlueprintReplyOutcome {
  /** Present only when the exchange changed the plan. */
  readonly analysis?: Analysis
  readonly result: WorkflowStageResult
}

/**
 * The analyst answers a maintainer without leaving the gate.
 *
 * Runs as Blueprint so it resumes that station's persistent session and still
 * has the plan it wrote in context. The turn has no structured output to
 * validate: what it did is what it recorded, so a revision is detected from the
 * tool call rather than parsed out of prose. A turn that only talks is a
 * complete, correct turn.
 */
export async function runBlueprintReply(
  input: BlueprintReplyInput,
): Promise<BlueprintReplyOutcome> {
  const result = await runWorkflowStage({
    agent: input.config.agents.analyst,
    runId: input.runId,
    station: 'analyst',
    ...(input.signal === undefined ? {} : { signal: input.signal }),
    subject: {
      repo: input.repo,
      kind: 'issue',
      number: input.issueNumber,
    },
    title: `reply at the plan gate for #${input.issueNumber}`,
    label: 'blueprint',
    worktree: input.worktree,
    systemRules: buildWorkflowStageRules('analyst'),
    task: buildReplyPrompt({
      repo: input.repo,
      issueNumber: input.issueNumber,
      question: input.question,
      history: input.history,
      tools: toolSurfaceIsUp(),
    }),
    // Still reads only. The gate is open, so nothing has been approved and the
    // planning station has no business touching the repository.
    permission: 'approve-reads',
    config: input.config,
  })
  return {
    ...(result.recorded.analysis === undefined
      ? {}
      : { analysis: result.recorded.analysis }),
    result,
  }
}

export interface DispatchInput {
  readonly runId: string
  readonly repo: string
  readonly issue: GhIssue
  readonly worktree: string
  readonly history?: readonly { author: string; role: string; body: string }[]
  readonly config: Config
  readonly signal?: AbortSignal
}

/** Decides what an issue is, before any code is considered. Modifies nothing. */
export async function runDispatch(
  input: DispatchInput,
): Promise<{ triage: Triage; result: WorkflowStageResult }> {
  const { value, result } = await runStructuredStage(
    'classifier',
    {
      agent: input.config.agents.analyst,
      runId: input.runId,
      station: 'classifier',
      ...(input.signal === undefined ? {} : { signal: input.signal }),
      subject: { repo: input.repo, kind: 'issue', number: input.issue.number },
      title: input.issue.title,
      label: 'dispatch',
      worktree: input.worktree,
      systemRules: buildWorkflowStageRules('classifier'),
      task: buildDispatchPrompt({
        repo: input.repo,
        issue: input.issue,
        ...(input.history === undefined ? {} : { history: input.history }),
        tools: toolSurfaceIsUp(),
      }),
      // Reads only. Triage decides whether work should happen; it is not work.
      permission: 'approve-reads',
      config: input.config,
    },
    triageSchema,
    (result) => result.recorded.triage,
  )
  return { triage: value, result }
}
