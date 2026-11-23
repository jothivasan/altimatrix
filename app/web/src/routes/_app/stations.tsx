import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/stations')({
  beforeLoad: () => {
    throw redirect({ to: '/workflow', replace: true })
  },
})
