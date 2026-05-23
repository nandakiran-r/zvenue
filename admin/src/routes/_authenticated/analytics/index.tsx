import { createFileRoute } from '@tanstack/react-router'
import { AnalyticsPage } from '@/features/analytics'
import { AdminOnly } from '@/components/role-guard'

export const Route = createFileRoute('/_authenticated/analytics/')({
  component: () => <AdminOnly><AnalyticsPage /></AdminOnly>,
})
