import { createFileRoute } from '@tanstack/react-router'
import { BookingsPage } from '@/features/bookings-management'
import { OwnerBookingsPage } from '@/features/owner-portal/owner-bookings'
import { useAuth } from '@/context/auth-provider'

function BookingsRoute() {
  const { role } = useAuth()
  if (role === 'owner') return <OwnerBookingsPage />
  return <BookingsPage />
}

export const Route = createFileRoute('/_authenticated/bookings/')({
  component: BookingsRoute,
})
