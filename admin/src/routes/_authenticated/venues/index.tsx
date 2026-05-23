import { createFileRoute } from '@tanstack/react-router'
import { VenuesPage } from '@/features/venues'
import { OwnerVenuesPage } from '@/features/owner-portal/owner-venues'
import { useAuth } from '@/context/auth-provider'

function VenuesRoute() {
  const { role } = useAuth()
  if (role === 'owner') return <OwnerVenuesPage />
  return <VenuesPage />
}

export const Route = createFileRoute('/_authenticated/venues/')({
  component: VenuesRoute,
})
