import {
  Check,
  GitBranch,
  ListChecks,
  ShieldCheck,
  SlidersHorizontal,
  Zap,
} from 'lucide-react'
import { Screen } from '@/components/layout/Screen'
import './settings.css'
import { ErrorNote, Loading } from '@/components/state'
import { useSaveSettings, useSettings } from '@/modules/api/settings.hooks'
import { POLICIES } from '@/screens/repos/repos.components'
import { Field, NumberField, ParallelRuns, Toggle } from './settings.components'

/**
 * What the factory does, and how much of it without a person.
 *
 * Each control saves on its own rather than behind one button, because the
 * route takes a partial and a save button would invite restating every field
 * to change one of them.
 */
export function Settings() {
  const settings = useSettings()
  const save = useSaveSettings()

  if (settings.isPending) {
    return (
      <Screen title="Settings">
        <Loading />
      </Screen>
    )
  }

  if (settings.isError) {
    return (
      <Screen title="Settings">
        <ErrorNote
          message={settings.error.message}
          onRetry={() => settings.refetch()}
        />
      </Screen>
    )
  }

  const current = settings.data.settings

  return (
    <div className="factory-settings">
      <h1 className="sr-only">Settings</h1>
      <section
        className="settings-panel policy-panel"
        aria-labelledby="policy-heading"
      >
        <h2 id="policy-heading">Default run policy</h2>
        <p>Applies to repositories that inherit the workspace default.</p>
        <div className="policy-options">
          {POLICIES.map((policy) => {
            const Icon =
              policy.value === 'automatic'
                ? Zap
                : policy.value === 'plan_gate'
                  ? ListChecks
                  : GitBranch
            const selected = current.defaultPolicy === policy.value
            return (
              <button
                type="button"
                key={policy.value}
                aria-pressed={selected}
                disabled={save.isPending}
                onClick={() => save.mutate({ defaultPolicy: policy.value })}
              >
                <span className="policy-symbol">
                  <Icon size={20} />
                </span>
                <span className="policy-check" aria-hidden="true">
                  {selected && <Check size={12} strokeWidth={3} />}
                </span>
                <strong>{policy.label}</strong>
                <span className="policy-description">{policy.detail}</span>
              </button>
            )
          })}
        </div>
      </section>
      <div className="settings-columns">
        <section className="settings-panel">
          <h2 className="panel-heading">
            <SlidersHorizontal size={18} /> Run limits
          </h2>
          <Field
            label="Parallel runs"
            detail="Each active run uses its own agent and checkout."
          >
            <ParallelRuns
              value={current.maxParallelRuns}
              onChange={(maxParallelRuns) => save.mutate({ maxParallelRuns })}
            />
          </Field>
          <Field
            label="Polling interval"
            detail="Seconds between GitHub checks."
          >
            <NumberField
              value={current.pollSeconds}
              label="Polling interval in seconds"
              min={10}
              onCommit={(pollSeconds) => save.mutate({ pollSeconds })}
            />
          </Field>
          <Field
            label="Revision limit"
            detail="Maximum times Inspection can send work back."
          >
            <NumberField
              value={current.maxRevisions}
              label="Revision limit"
              min={0}
              onCommit={(maxRevisions) => save.mutate({ maxRevisions })}
            />
          </Field>
        </section>
        <section className="settings-panel">
          <h2 className="panel-heading">
            <ShieldCheck size={18} /> Trust and notifications
          </h2>
          <Field
            label="Trusted authors only"
            detail="Only trusted authors can trigger agents with shell access. Turn off to allow anyone."
          >
            <Toggle
              label="trusted authors only"
              checked={current.trustedAuthorsOnly}
              onChange={(trustedAuthorsOnly) =>
                save.mutate({ trustedAuthorsOnly })
              }
            />
          </Field>
          <Field
            label="Ask for permission"
            detail="Pause when an agent needs extra permissions. Requests expire when the turn ends."
          >
            <Toggle
              label="ask on permission"
              checked={current.askOnPermission}
              onChange={(askOnPermission) => save.mutate({ askOnPermission })}
            />
          </Field>
          <Field
            label="Gate notifications"
            detail="Get a notification when a stage needs your decision."
          >
            <Toggle
              checked={current.notifications}
              label="notify on a gate"
              onChange={(notifications) => save.mutate({ notifications })}
            />
          </Field>
        </section>
      </div>
      {save.isError ? (
        <p role="alert" className="text-[12.5px] text-destructive">
          {save.error.message}
        </p>
      ) : null}
    </div>
  )
}
