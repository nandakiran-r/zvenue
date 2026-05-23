import { useAuth } from '@/context/auth-provider'
import { Navigate } from '@tanstack/react-router'

/**
 * Blocks owners from accessing admin-only pages.
 * Wrap any admin-only page component with this.
 */
export function AdminOnly({ children }: { children: React.ReactNode }) {
  const { role } = useAuth()
  if (role === 'owner') {
    return <Navigate to='/' />
  }
  return <>{children}</>
}
