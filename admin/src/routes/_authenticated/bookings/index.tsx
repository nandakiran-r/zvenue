import { createFileRoute } from '@tanstack/react-router'
import { BookingsPage } from '@/features/bookings-management'

export const Route = createFileRoute('/_authenticated/bookings/')({
  component: BookingsPage,
})
