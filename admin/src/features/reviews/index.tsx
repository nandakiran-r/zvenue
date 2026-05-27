import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Star,
  Search as SearchIcon,
  Trash2,
  Calendar,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { fetchAdminReviews, deleteAdminReview, type AdminReview } from '@/lib/api'

function StarRating({ rating }: { rating: number }) {
  return (
    <div className='flex items-center gap-0.5'>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-3.5 w-3.5 ${star <= rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`}
        />
      ))}
    </div>
  )
}

export function ReviewsPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [ratingFilter, setRatingFilter] = useState<string>('all')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedReview, setSelectedReview] = useState<AdminReview | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-reviews', page, ratingFilter],
    queryFn: () =>
      fetchAdminReviews({
        page,
        limit: 20,
        rating: ratingFilter !== 'all' ? parseInt(ratingFilter) : undefined,
      }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAdminReview(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] })
      setDeleteDialogOpen(false)
      setSelectedReview(null)
      toast.success('Review deleted successfully')
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Failed to delete review')
    },
  })

  const reviews = data?.reviews || []
  const pagination = data?.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 }

  return (
    <>
      <Header fixed>
        <Search className='me-auto' />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div className='flex flex-wrap items-end justify-between gap-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Reviews</h2>
            <p className='text-muted-foreground'>
              Manage and moderate customer reviews ({pagination.total} total)
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className='flex flex-wrap gap-3'>
          <Select value={ratingFilter} onValueChange={(v) => { setRatingFilter(v); setPage(1); }}>
            <SelectTrigger className='w-[160px]'>
              <SelectValue placeholder='All Ratings' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Ratings</SelectItem>
              <SelectItem value='5'>5 Stars</SelectItem>
              <SelectItem value='4'>4 Stars</SelectItem>
              <SelectItem value='3'>3 Stars</SelectItem>
              <SelectItem value='2'>2 Stars</SelectItem>
              <SelectItem value='1'>1 Star</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Reviews Table */}
        <Card>
          <CardContent className='p-0'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reviewer</TableHead>
                  <TableHead>Venue</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead className='max-w-[300px]'>Comment</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className='text-right'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 6 }).map((_, j) => (
                          <TableCell key={j}><Skeleton className='h-4 w-20' /></TableCell>
                        ))}
                      </TableRow>
                    ))
                  : reviews.map((review) => (
                      <TableRow key={review.id}>
                        <TableCell>
                          <div className='flex items-center gap-3'>
                            <Avatar className='h-8 w-8'>
                              <AvatarImage src={review.user?.avatar_url || undefined} />
                              <AvatarFallback>
                                {(review.user?.full_name || 'U')[0].toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className='text-sm font-medium'>
                              {review.user?.full_name || 'Unknown'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className='text-sm font-medium'>{review.venue?.name || 'Unknown'}</p>
                            <p className='text-xs text-muted-foreground'>{review.venue?.city || ''}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <StarRating rating={review.rating} />
                        </TableCell>
                        <TableCell className='max-w-[300px]'>
                          <p className='text-sm text-muted-foreground truncate'>
                            {review.comment || <span className='italic'>No comment</span>}
                          </p>
                        </TableCell>
                        <TableCell>
                          <div className='flex items-center gap-1 text-sm text-muted-foreground'>
                            <Calendar className='h-3 w-3' />
                            {new Date(review.created_at).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell className='text-right'>
                          <Button
                            variant='ghost'
                            size='icon'
                            className='text-destructive'
                            onClick={() => {
                              setSelectedReview(review)
                              setDeleteDialogOpen(true)
                            }}
                          >
                            <Trash2 className='h-4 w-4' />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                {!isLoading && reviews.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className='h-24 text-center text-muted-foreground'>
                      No reviews found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className='flex items-center justify-between'>
            <p className='text-sm text-muted-foreground'>
              Page {pagination.page} of {pagination.totalPages}
            </p>
            <div className='flex gap-2'>
              <Button
                variant='outline'
                size='sm'
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <Button
                variant='outline'
                size='sm'
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Main>

      {/* Delete Confirmation */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Review</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this review by{' '}
              <strong>{selectedReview?.user?.full_name || 'Unknown'}</strong> for{' '}
              <strong>{selectedReview?.venue?.name || 'Unknown'}</strong>?
              This action cannot be undone and will recalculate the venue's rating.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant='outline' onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant='destructive'
              onClick={() => selectedReview && deleteMutation.mutate(selectedReview.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Review'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
