import { createFileRoute } from '@tanstack/react-router'
import { AppContentPage } from '@/features/app-content'

export const Route = createFileRoute('/_authenticated/app-content/')({
  component: AppContentPage,
})
