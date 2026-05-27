import { createFileRoute } from '@tanstack/react-router'
import { ServiceListingsPage } from '@/features/service-listings'

export const Route = createFileRoute('/_authenticated/service-listings/')({
  component: ServiceListingsPage,
})
