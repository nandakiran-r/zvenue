import { createFileRoute } from '@tanstack/react-router'
import { NotificationsPage } from '@/features/notifications-management'
import { OwnerNotificationsPage } from '@/features/owner-portal/owner-notifications'
import { useAuth } from '@/context/auth-provider'

function NotificationsRoute() {
  const { role } = useAuth()
  if (role === 'owner') return <OwnerNotificationsPage />
  return <NotificationsPage />
}

export const Route = createFileRoute('/_authenticated/notifications/')({
  component: NotificationsRoute,
})
