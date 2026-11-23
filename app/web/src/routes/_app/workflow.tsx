import { createFileRoute } from '@tanstack/react-router'
import { Workflow } from '@/screens/workflow/Workflow'

export const Route = createFileRoute('/_app/workflow')({
  component: Workflow,
})
