import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ConfigDrawer } from '@/components/config-drawer'
import { fetchAdminServiceBookings, refundServiceBooking, fetchServiceCategories } from '@/lib/api'

function statusBadge(status: string) {
  if (status === 'confirmed') return <Badge className='bg-emerald-100 text-emerald-700 hover:bg-emerald-100'>Confirmed</Badge>
  if (status === 'cancelled') return <Badge className='bg-red-100 text-red-700 hover:bg-red-100'>Cancelled</Badge>
  if (status === 'refunded') return <Badge className='bg-amber-100 text-amber-700 hover:bg-amber-100'>Refunded</Badge>
  if (status === 'payment_failed') return <Badge variant='destructive'>Failed</Badge>
  if (status === 'pending') return <Badge className='bg-gray-100 text-gray-700 hover:bg-gray-100'>Pending</Badge>
  return <Badge variant='outline'>{status}</Badge>
}

export function ServiceBookingsPage() {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [refundDialogOpen, setRefundDialogOpen] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<any>(null)
  const [refundReason, setRefundReason] = useState('')

  const { data: categories } = useQuery({ queryKey: ['svc-cats-filter'], queryFn: fetchServiceCategories })
  const { data, isLoading } = useQuery({
    queryKey: ['admin-service-bookings', statusFilter, page],
    queryFn: () => fetchAdminServiceBookings({ status: statusFilter !== 'all' ? statusFilter : undefined, page }),
  })

  const refundMut = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => refundServiceBooking(id, reason),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-service-bookings'] }); setRefundDialogOpen(false); toast.success('Refund processed') },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Refund failed'),
  })

  const bookings = data?.bookings || []
  const pagination = data?.pagination || { page: 1, totalPages: 1, total: 0 }
  const formatINR = (n: number) => `₹${(n || 0).toLocaleString('en-IN')}`

  return (
    <>
      <Header fixed><Search className='me-auto' /><ThemeSwitch /><ConfigDrawer /><ProfileDropdown /></Header>
      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div className='flex flex-wrap items-end justify-between gap-2'>
          <div><h2 className='text-2xl font-bold'>Service Bookings</h2><p className='text-muted-foreground'>{pagination.total} total bookings</p></div>
          <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger className='w-[160px]'><SelectValue placeholder='All Status' /></SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Status</SelectItem>
              <SelectItem value='confirmed'>Confirmed</SelectItem>
              <SelectItem value='cancelled'>Cancelled</SelectItem>
              <SelectItem value='refunded'>Refunded</SelectItem>
              <SelectItem value='payment_failed'>Failed</SelectItem>
              <SelectItem value='pending'>Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card><CardContent className='p-0'>
          <Table>
            <TableHeader><TableRow><TableHead>Booking ID</TableHead><TableHead>User</TableHead><TableHead>Service</TableHead><TableHead>Qty</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead><TableHead className='text-right'>Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {isLoading ? Array.from({ length: 5 }).map((_, i) => <TableRow key={i}>{Array.from({ length: 8 }).map((_, j) => <TableCell key={j}><Skeleton className='h-4 w-16' /></TableCell>)}</TableRow>) :
              bookings.map((b: any) => (
                <TableRow key={b.id}>
                  <TableCell className='font-mono text-xs'>{b.booking_id_display || b.id.slice(0, 8)}</TableCell>
                  <TableCell><p className='text-sm font-medium'>{b.user?.full_name || '—'}</p><p className='text-xs text-muted-foreground'>{b.user?.email || ''}</p></TableCell>
                  <TableCell><p className='text-sm'>{b.listing?.name || '—'}</p><p className='text-xs text-muted-foreground'>{b.listing?.category?.name || ''}</p></TableCell>
                  <TableCell>{b.quantity}</TableCell>
                  <TableCell className='font-medium'>{formatINR(b.total_amount)}</TableCell>
                  <TableCell>{statusBadge(b.status)}</TableCell>
                  <TableCell className='text-xs text-muted-foreground'>{new Date(b.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className='text-right'>
                    {b.status === 'confirmed' && (
                      <Button variant='outline' size='sm' onClick={() => { setSelectedBooking(b); setRefundReason(''); setRefundDialogOpen(true); }}>
                        <RefreshCw className='mr-1 h-3 w-3' />Refund
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && bookings.length === 0 && <TableRow><TableCell colSpan={8} className='h-24 text-center text-muted-foreground'>No service bookings found</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent></Card>

        {pagination.totalPages > 1 && (
          <div className='flex items-center justify-between'>
            <p className='text-sm text-muted-foreground'>Page {pagination.page} of {pagination.totalPages}</p>
            <div className='flex gap-2'>
              <Button variant='outline' size='sm' disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
              <Button variant='outline' size='sm' disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          </div>
        )}
      </Main>

      <Dialog open={refundDialogOpen} onOpenChange={setRefundDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Refund Booking</DialogTitle>
            <DialogDescription>Refund {selectedBooking?.booking_id_display} — {formatINR(selectedBooking?.total_amount)} to {selectedBooking?.user?.full_name}</DialogDescription>
          </DialogHeader>
          <div className='py-4'><Label>Reason (optional)</Label><Textarea value={refundReason} onChange={e => setRefundReason(e.target.value)} placeholder='Reason for refund...' /></div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setRefundDialogOpen(false)}>Cancel</Button>
            <Button variant='destructive' onClick={() => selectedBooking && refundMut.mutate({ id: selectedBooking.id, reason: refundReason })} disabled={refundMut.isPending}>{refundMut.isPending ? 'Processing...' : 'Confirm Refund'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className='text-sm font-medium mb-1 block'>{children}</label>
}
