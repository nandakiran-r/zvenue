import { createFileRoute } from '@tanstack/react-router'
import { ServiceCategoriesPage } from '@/features/service-categories'

export const Route = createFileRoute('/_authenticated/service-categories/')({
  component: ServiceCategoriesPage,
})
