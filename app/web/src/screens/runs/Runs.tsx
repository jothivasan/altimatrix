import { Link } from '@tanstack/react-router'
import { Activity, ExternalLink, GitBranch, History } from 'lucide-react'
import { useState } from 'react'
import { Screen } from '@/components/layout/Screen'
import { QuietState, SectionPanel } from '@/components/layout/SectionPanel'
import { ErrorNote, Loading } from '@/components/state'
import { useActiveRuns, usePastRuns } from '@/modules/api/runs.hooks'

export function Runs() {
  const runs = usePastRuns()
  const active = useActiveRuns()
  const [status, setStatus] = useState('all')
  const history = runs.data?.runs ?? []
  const statuses = [...new Set(history.map((run) => run.status))]
  const visible = history.filter(
    (run) => status === 'all' || run.status === status,
  )
  return (
    <Screen title="Runs">
      <SectionPanel
        title="Run history"
        icon={History}
        count={runs.data ? history.length : undefined}
        tone="blue"
      >
        {runs.isPending && <Loading rows={4} />}
        {runs.isError && (
          <ErrorNote
            message={runs.error.message}
            onRetry={() => runs.refetch()}
          />
        )}
        {runs.data && (
          <>
            {history.length > 0 && (
              <fieldset
                className="scope-filter"
                aria-label="Filter run history"
              >
                {Array.from(new Set(['all', ...statuses, status])).map(
                  (option) => (
                    <button
                      type="button"
                      key={option}
                      aria-pressed={status === option}
                      onClick={() => setStatus(option)}
                      className="capitalize"
                    >
                      {option}
                    </button>
                  ),
                )}
              </fieldset>
            )}
            {visible.length === 0 && (
              <QuietState
                title={history.length ? 'No matching runs' : 'No runs yet'}
                icon={Activity}
                action={
                  <Link className="section-action" to="/queue">
                    View queue
                  </Link>
                }
              >
                Started runs appear here with their status, branch and pull
                request.
              </QuietState>
            )}
            {visible.map((run) => {
              const runId = active.data?.runs.find((row) =>
                row.runId.startsWith(`${run.repo}#${run.issue}@`),
              )?.runId
              const subject = `${run.repo}#${run.issue}`
              return (
                <article className="run-record" key={subject}>
                  <GitBranch
                    size={19}
                    className="shrink-0 text-muted-foreground"
                  />
                  <div className="min-w-0 flex-1 [overflow-wrap:anywhere]">
                    {runId ? (
                      <Link
                        className="font-semibold text-primary hover:underline"
                        to="/runs/$runId"
                        params={{ runId }}
                      >
                        {subject}
                      </Link>
                    ) : (
                      <strong>{subject}</strong>
                    )}
                    {run.branch && (
                      <p className="mt-1 font-mono text-muted-foreground text-sm">
                        {run.branch}
                      </p>
                    )}
                  </div>
                  <span className="run-status" data-status={run.status}>
                    {run.status}
                  </span>
                  {run.pr_url && (
                    <a
                      className="section-action"
                      href={run.pr_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Pull request
                      <ExternalLink size={15} />
                    </a>
                  )}
                </article>
              )
            })}
          </>
        )}
      </SectionPanel>
    </Screen>
  )
}
