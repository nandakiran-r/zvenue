import { createFileRoute } from '@tanstack/react-router'
import { Dashboard } from '@/features/dashboard'
import { OwnerAnalyticsPage } from '@/features/owner-portal/owner-analytics'
import { useAuth } from '@/context/auth-provider'

function IndexRoute() {
  const { role } = useAuth()
  if (role === 'owner') return <OwnerAnalyticsPage />
  return <Dashboard />
}

export const Route = createFileRoute('/_authenticated/')({
  component: IndexRoute,
})
