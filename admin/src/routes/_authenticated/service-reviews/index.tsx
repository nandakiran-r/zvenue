import { createFileRoute } from '@tanstack/react-router'
import { ServiceReviewsPage } from '@/features/service-reviews'

export const Route = createFileRoute('/_authenticated/service-reviews/')({
  component: ServiceReviewsPage,
})
