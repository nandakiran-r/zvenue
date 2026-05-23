import { createFileRoute } from '@tanstack/react-router'
import { CategoriesPage } from '@/features/categories'
import { AdminOnly } from '@/components/role-guard'

export const Route = createFileRoute('/_authenticated/categories/')({
  component: () => <AdminOnly><CategoriesPage /></AdminOnly>,
})
