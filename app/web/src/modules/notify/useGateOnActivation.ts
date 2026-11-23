import { useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { recentlyAnnouncedGate } from '@/modules/notify/notify'

// Return to the most recently announced gate when a hidden tab becomes visible.
export function useGateOnActivation(): void {
  const navigate = useNavigate()

  // Subscribing to a document event, which is an external source and cannot be
  // expressed as a render or a handler.
  useEffect(() => {
    let wasHidden = document.visibilityState === 'hidden'

    const onVisibility = (): void => {
      const hidden = document.visibilityState === 'hidden'
      const cameBack = wasHidden && !hidden
      wasHidden = hidden
      if (!cameBack) {
        return
      }
      const gateId = recentlyAnnouncedGate()
      if (gateId === undefined) {
        return
      }
      void navigate({ to: '/gates/$gateId', params: { gateId } })
    }

    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [navigate])
}
