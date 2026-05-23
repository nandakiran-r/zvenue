import { createFileRoute } from '@tanstack/react-router'
import { OwnersPage } from '@/features/owners'
import { AdminOnly } from '@/components/role-guard'

export const Route = createFileRoute('/_authenticated/owners/')({
  component: () => <AdminOnly><OwnersPage /></AdminOnly>,
})
