import { createFileRoute } from '@tanstack/react-router'
import { ServiceBookingsPage } from '@/features/service-bookings'

export const Route = createFileRoute('/_authenticated/service-bookings/')({
  component: ServiceBookingsPage,
})
