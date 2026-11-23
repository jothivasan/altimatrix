import { Link, useParams } from '@tanstack/react-router'
import { subjectOf } from 'altimatrix/shared'
import { Activity, Route } from 'lucide-react'
import { Screen } from '@/components/layout/Screen'
import { SectionPanel } from '@/components/layout/SectionPanel'
import { Empty, ErrorNote, Loading } from '@/components/state'
import { useRunEvents } from '@/modules/api/runs.hooks'
import { Belt, Criteria, EventLog } from './run-detail.components'
import {
  criteriaOf,
  outcomeOf,
  runStageStates,
  verdictOf,
} from './run-detail.helpers'

/**
 * One run, as it said it happened.
 *
 * Built from the event log rather than a stored summary, because a run that is
 * still working has no summary yet and the interesting case is watching it.
 */
export function RunDetail() {
  const { runId } = useParams({ from: '/_app/runs/$runId' })
  const live = useRunEvents({ variables: { runId } })

  if (live.isPending) {
    return (
      <Screen title="Run">
        <Loading />
      </Screen>
    )
  }

  if (live.isError) {
    return (
      <Screen title="Run">
        <ErrorNote
          message={live.error.message}
          onRetry={() => live.refetch()}
        />
      </Screen>
    )
  }

  const events = live.data.events
  const verdict = verdictOf(events)

  return (
    <Screen
      title={subjectOf(runId)}
      sub={outcomeOf(events)}
      actions={
        <Link to="/runs" className="section-action">
          All runs
        </Link>
      }
    >
      {events.length === 0 ? (
        <Empty
          title="Nothing recorded for this run"
          detail="The factory keeps what a run said in memory while it works. A run from before the last restart has only its outcome, on the runs list."
        />
      ) : (
        <div className="compose-layout">
          <SectionPanel
            title="Event timeline"
            icon={Activity}
            count={events.length}
            tone="blue"
          >
            <EventLog events={events} />
          </SectionPanel>
          <SectionPanel title="Run progress" icon={Route}>
            <Belt states={runStageStates(events)} />
            <Criteria
              criteria={criteriaOf(events)}
              results={verdict?.results ?? []}
            />
          </SectionPanel>
        </div>
      )}
    </Screen>
  )
}
