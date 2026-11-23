import { useQueryClient } from '@tanstack/react-query'
import {
  CircleDot,
  FolderGit2,
  GitBranch,
  GitPullRequest,
  ListChecks,
  Plus,
  X,
  Zap,
} from 'lucide-react'
import { useState } from 'react'
import './repos.css'
import { ErrorNote, Loading } from '@/components/state'
import {
  useSetRepoPolicy,
  useUnwatchRepo,
  useWatchedRepos,
} from '@/modules/api/repos.hooks'
import { AddRepoPanel } from './AddRepoPanel'
import { POLICIES, PolicyPicker } from './repos.components'

/**
 * Watched repositories.
 *
 * From this screen, adding a repo is
 * a click on something the account already owns, not a hand edited JSON file
 * in a directory you have to be told about.
 */
export function Repos() {
  const [picking, setPicking] = useState(false)
  const watched = useWatchedRepos()
  const queryClient = useQueryClient()
  const refresh = () =>
    void queryClient.invalidateQueries({ queryKey: useWatchedRepos.getKey() })
  const unwatch = useUnwatchRepo({ onSuccess: refresh })
  const setPolicy = useSetRepoPolicy()

  if (watched.isPending) return <Loading rows={3} />
  if (watched.isError)
    return (
      <ErrorNote
        message={watched.error.message}
        onRetry={() => watched.refetch()}
      />
    )

  const repos = watched.data.repos
  const addButton = (
    <button className="repo-add" type="button" onClick={() => setPicking(true)}>
      <Plus size={16} /> Add repository
    </button>
  )

  return (
    <div className="repo-directory">
      {picking && (
        <AddRepoPanel
          watched={repos.map((r) => r.repo)}
          onDone={() => {
            setPicking(false)
            refresh()
          }}
        />
      )}
      <section aria-labelledby="watched-title" className="repo-collection">
        <header className="repo-toolbar">
          <h1 id="watched-title">
            Watched repositories{' '}
            <span className="repo-count">{repos.length}</span>
          </h1>
          {repos.length > 0 && !picking && addButton}
        </header>
        {repos.length === 0 ? (
          <div className="repo-onboarding">
            <div className="repo-invite">
              <h2>Watch your first repository</h2>
              <p>
                Choose a GitHub repository to follow its issues and pull
                requests, then set how the factory handles new work.
              </p>
              {!picking && addButton}
            </div>
            <div aria-hidden="true" className="repo-illustration">
              <span className="repo-source">
                <FolderGit2 size={34} />
              </span>
              <span className="repo-wire" />
              <div className="repo-events">
                <span>
                  <CircleDot />
                </span>
                <span>
                  <GitPullRequest />
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="repo-entries">
            {repos.map((repo) => (
              <div key={repo.repo} className="repo-entry">
                <div className="min-w-0 flex-1">
                  <div className="break-all font-medium text-base">
                    {repo.repo}
                  </div>
                  <div className="text-muted-foreground text-sm">
                    {repo.requireLabel
                      ? `only issues labelled ${repo.requireLabel}`
                      : 'every issue that passes the door'}
                  </div>
                </div>
                <PolicyPicker
                  value={repo.policy ?? 'automatic'}
                  pending={setPolicy.isPending}
                  onChange={(policy) =>
                    setPolicy.mutate({ repo: repo.repo, policy })
                  }
                />
                <button
                  type="button"
                  aria-label={`Stop watching ${repo.repo}`}
                  onClick={() => unwatch.mutate({ repo: repo.repo })}
                  disabled={unwatch.isPending}
                  className="inline-flex min-h-11 w-fit min-w-11 items-center justify-center rounded-lg border border-border px-2.5 py-1.5 text-[12px] text-muted-foreground hover:text-foreground lg:min-h-0 lg:min-w-0"
                >
                  <X className="mr-1 size-3.5" /> Stop watching
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
      <section aria-labelledby="repo-policies" className="repo-policy-section">
        <h2 id="repo-policies">Run policies</h2>
        <dl className="repo-policy-list">
          {POLICIES.map((policy) => {
            const Icon =
              policy.value === 'automatic'
                ? Zap
                : policy.value === 'plan_gate'
                  ? ListChecks
                  : GitBranch
            return (
              <div key={policy.value}>
                <dt>
                  <span>
                    <Icon size={18} />
                  </span>
                  {policy.label}
                </dt>
                <dd>{policy.detail}</dd>
              </div>
            )
          })}
        </dl>
      </section>
    </div>
  )
}
