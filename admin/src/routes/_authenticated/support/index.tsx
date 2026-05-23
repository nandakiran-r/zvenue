import { createFileRoute } from '@tanstack/react-router'
import { SupportPage } from '@/features/support'

export const Route = createFileRoute('/_authenticated/support/')({
  component: SupportPage,
})
