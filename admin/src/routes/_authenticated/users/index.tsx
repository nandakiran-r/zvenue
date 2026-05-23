import { createFileRoute } from '@tanstack/react-router'
import { UsersManagementPage } from '@/features/users-management'
import { AdminOnly } from '@/components/role-guard'

export const Route = createFileRoute('/_authenticated/users/')({
  component: () => <AdminOnly><UsersManagementPage /></AdminOnly>,
})
