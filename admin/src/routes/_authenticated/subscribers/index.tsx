import { createFileRoute } from '@tanstack/react-router'
import { SubscribersPage } from '@/features/subscribers'
import { AdminOnly } from '@/components/role-guard'

export const Route = createFileRoute('/_authenticated/subscribers/')({
  component: () => <AdminOnly><SubscribersPage /></AdminOnly>,
})
