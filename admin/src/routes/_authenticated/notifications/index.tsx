import { createFileRoute } from '@tanstack/react-router'
import { NotificationsPage } from '@/features/notifications-management'

export const Route = createFileRoute('/_authenticated/notifications/')({
  component: NotificationsPage,
})
