import { createFileRoute } from '@tanstack/react-router'
import { VenuesPage } from '@/features/venues'

export const Route = createFileRoute('/_authenticated/venues/')({
  component: VenuesPage,
})
