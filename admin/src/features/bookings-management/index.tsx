import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  CalendarCheck,
  Search as SearchIcon,
  MapPin,
  Clock,
  Users,
  Eye,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
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
import { fetchBookings, updateBooking, deleteBooking, confirmBookingPayment } from '@/lib/api'

function formatINR(amount: number) {
  return `₹${(amount || 0).toLocaleString('en-IN')}`
}

function formatStatus(status: string) {
  switch (status?.toLowerCase()) {
    case 'pre_booked': return 'Pre-Booked'
    case 'confirmed': return 'Confirmed'
    case 'pending': return 'Pending'
    case 'cancelled': return 'Cancelled'
    case 'payment_failed': return 'Failed'
    case 'refunded': return 'Refunded'
    default: return status
  }
}

function getSessionLabel(startTime: string, endTime: string) {
  if (startTime === '08:00 AM' && endTime === '12:00 PM') return 'Morning'
  if (startTime === '01:00 PM' && endTime === '05:00 PM') return 'Afternoon'
  if (startTime === '08:00 AM' && endTime === '05:00 PM') return 'Full Day'
  return `${startTime || ''} - ${endTime || ''}`
}

function statusVariant(status: string) {
  switch (status?.toLowerCase()) {
    case 'confirmed':
      return 'default' as const
    case 'pre_booked':
      return 'secondary' as const
    case 'pending':
      return 'secondary' as const
    case 'cancelled':
      return 'destructive' as const
    default:
      return 'outline' as const
  }
}

function StatusIcon({ status }: { status: string }) {
  switch (status?.toLowerCase()) {
    case 'confirmed':
      return <CheckCircle className='h-4 w-4 text-emerald-500' />
    case 'pre_booked':
      return <AlertCircle className='h-4 w-4 text-orange-500' />
    case 'pending':
      return <AlertCircle className='h-4 w-4 text-amber-500' />
    case 'cancelled':
      return <XCircle className='h-4 w-4 text-red-500' />
    default:
      return null
  }
}

export function BookingsPage() {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<any>(null)
  const [confirmPaymentDialogOpen, setConfirmPaymentDialogOpen] = useState(false)
  const [transactionId, setTransactionId] = useState('')
  const [txnError, setTxnError] = useState('')

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['admin-bookings', statusFilter, search],
    queryFn: () =>
      fetchBookings({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: search || undefined,
      }),
    refetchInterval: 5000, // Sync lively every 5 seconds
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      updateBooking(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      toast.success('Booking updated successfully!')
    },
    onError: (err: any) => {
      const message = err.response?.data?.message || err.response?.data?.error || 'Failed to update booking'
      toast.error(message)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteBooking(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      setDeleteDialogOpen(false)
      setSelectedBooking(null)
      toast.success('Booking deleted successfully!')
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to delete booking'),
  })

  const confirmPaymentMutation = useMutation({
    mutationFn: () => confirmBookingPayment(selectedBooking!.id, transactionId.trim()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      setConfirmPaymentDialogOpen(false)
      setTransactionId('')
      setTxnError('')
      toast.success('Booking fully confirmed!')
    },
    onError: (err: any) => {
      setTxnError(err.response?.data?.error || 'Failed to confirm payment')
    },
  })

  const handleStatusChange = (bookingId: string, newStatus: string) => {
    updateMutation.mutate({ id: bookingId, data: { status: newStatus } })
  }

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
            <h2 className='text-2xl font-bold tracking-tight'>Bookings</h2>
            <p className='text-muted-foreground'>
              Manage and track all venue bookings
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className='flex flex-wrap gap-3'>
          <div className='relative flex-1 min-w-[200px] max-w-sm'>
            <SearchIcon className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
            <Input
              placeholder='Search bookings...'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className='pl-9'
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className='w-[160px]'>
              <SelectValue placeholder='All Status' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Status</SelectItem>
              <SelectItem value='pending'>Pending</SelectItem>
              <SelectItem value='pre_booked'>Pre-Booked</SelectItem>
              <SelectItem value='confirmed'>Confirmed</SelectItem>
              <SelectItem value='cancelled'>Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Bookings Table */}
        <Card>
          <CardContent className='p-0'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Booking ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Venue</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead className='text-center'>Guests</TableHead>
                  <TableHead className='text-right'>Total</TableHead>
                  <TableHead className='text-center'>Payment</TableHead>
                  <TableHead className='text-center'>Status</TableHead>
                  <TableHead className='text-right'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 10 }).map((_, j) => (
                          <TableCell key={j}><Skeleton className='h-4 w-20' /></TableCell>
                        ))}
                      </TableRow>
                    ))
                  : (bookings || []).map((booking: any) => (
                      <TableRow key={booking.id}>
                        <TableCell>
                          <span className='font-mono text-xs font-bold text-primary'>
                            {booking.booking_id_display || `#${booking.id.slice(0, 8)}`}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className='flex items-center gap-3'>
                            <Avatar className='h-8 w-8'>
                              <AvatarImage src={booking.user?.avatar_url} />
                              <AvatarFallback>
                                {(booking.user?.full_name || 'U')[0].toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className='text-sm font-medium'>
                                {booking.user?.full_name || 'Unknown'}
                              </p>
                              {booking.user?.phone_number ? (
                                <a href={`https://wa.me/${booking.user.phone_number.replace(/[^0-9]/g, '')}`} target='_blank' rel='noreferrer' className='text-xs text-green-600 hover:underline'>
                                  {booking.user.phone_number}
                                </a>
                              ) : (
                                <p className='text-xs text-muted-foreground'>
                                  {booking.user?.email || ''}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className='flex items-center gap-2'>
                            <Avatar className='h-8 w-8 rounded-md'>
                              <AvatarImage
                                src={booking.venue?.image_url}
                                className='object-cover'
                              />
                              <AvatarFallback className='rounded-md'>V</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className='text-sm font-medium'>
                                {booking.venue?.name || 'Unknown'}
                              </p>
                              <p className='text-xs text-muted-foreground flex items-center gap-1'>
                                <MapPin className='h-3 w-3' />
                                {booking.venue?.city || ''}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className='flex items-center gap-1'>
                            <CalendarCheck className='h-3 w-3 text-muted-foreground' />
                            <span className='text-sm'>{booking.booking_date}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className='flex items-center gap-1'>
                            <Clock className='h-3 w-3 text-muted-foreground' />
                            <span className='text-sm'>
                              {getSessionLabel(booking.start_time, booking.end_time)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className='text-center'>
                          <div className='flex items-center justify-center gap-1'>
                            <Users className='h-3 w-3 text-muted-foreground' />
                            {booking.guests}
                          </div>
                        </TableCell>
                        <TableCell className='text-right font-medium'>
                          {formatINR(booking.total || 0)}
                        </TableCell>
                        <TableCell className='text-center'>
                          <Badge variant='outline' className='text-xs'>
                            {booking.payment_method || 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell className='text-center'>
                          <Badge variant={statusVariant(booking.status)}>
                            <StatusIcon status={booking.status} />
                            <span className='ml-1'>{formatStatus(booking.status)}</span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className='flex items-center justify-end gap-1'>
                            <Button
                              variant='ghost'
                              size='icon'
                              onClick={() => {
                                setSelectedBooking(booking)
                                setDetailDialogOpen(true)
                              }}
                            >
                              <Eye className='h-4 w-4' />
                            </Button>
                            {booking.status === 'pending' && (
                              <>
                                <Button
                                  variant='ghost'
                                  size='icon'
                                  className='text-emerald-600'
                                  onClick={() => handleStatusChange(booking.id, 'confirmed')}
                                >
                                  <CheckCircle className='h-4 w-4' />
                                </Button>
                                <Button
                                  variant='ghost'
                                  size='icon'
                                  className='text-red-500'
                                  onClick={() => handleStatusChange(booking.id, 'cancelled')}
                                >
                                  <XCircle className='h-4 w-4' />
                                </Button>
                              </>
                            )}
                            <Button
                              variant='ghost'
                              size='icon'
                              className='text-destructive'
                              onClick={() => {
                                setSelectedBooking(booking)
                                setDeleteDialogOpen(true)
                              }}
                            >
                              <Trash2 className='h-4 w-4' />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                {!isLoading && (bookings || []).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} className='h-24 text-center text-muted-foreground'>
                      No bookings found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </Main>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className='max-w-2xl max-h-[85vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className='space-y-4'>
              <div className='flex items-center gap-4'>
                <Avatar className='h-12 w-12'>
                  <AvatarImage src={selectedBooking.user?.avatar_url} />
                  <AvatarFallback>
                    {(selectedBooking.user?.full_name || 'U')[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className='font-medium'>{selectedBooking.user?.full_name || 'Unknown'}</p>
                  <p className='text-sm text-muted-foreground'>{selectedBooking.booking_id_display || selectedBooking.user?.email}</p>
                  {selectedBooking.user?.phone_number && (
                    <div className='flex items-center gap-2 mt-1'>
                      <a href={`tel:${selectedBooking.user.phone_number}`} className='text-sm text-primary hover:underline'>
                        {selectedBooking.user.phone_number}
                      </a>
                      <a
                        href={`https://wa.me/${selectedBooking.user.phone_number.replace(/[^0-9]/g, '')}`}
                        target='_blank'
                        rel='noreferrer'
                        className='inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium hover:bg-green-200 transition-colors'
                      >
                        💬 WhatsApp
                      </a>
                    </div>
                  )}
                </div>
                <Badge variant={statusVariant(selectedBooking.status)} className='ml-auto'>
                  {formatStatus(selectedBooking.status)}
                </Badge>
              </div>

              <div className='rounded-lg border p-4 space-y-3'>
                <div className='flex items-center gap-3'>
                  <Avatar className='h-12 w-12 rounded-lg'>
                    <AvatarImage src={selectedBooking.venue?.image_url} className='object-cover' />
                    <AvatarFallback className='rounded-lg'>V</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className='font-medium'>{selectedBooking.venue?.name}</p>
                    <p className='text-xs text-muted-foreground'>{selectedBooking.venue?.city}</p>
                  </div>
                </div>
              </div>

              <div className='grid grid-cols-3 gap-4 text-center'>
                <div className='rounded-lg bg-muted p-3'>
                  <p className='text-xs text-muted-foreground'>Date</p>
                  <p className='font-medium text-sm'>{selectedBooking.booking_date}</p>
                </div>
                <div className='rounded-lg bg-muted p-3'>
                  <p className='text-xs text-muted-foreground'>Session</p>
                  <p className='font-medium text-sm'>{getSessionLabel(selectedBooking.start_time, selectedBooking.end_time)}</p>
                </div>
                <div className='rounded-lg bg-muted p-3'>
                  <p className='text-xs text-muted-foreground'>Guests</p>
                  <p className='font-medium text-sm'>{selectedBooking.guests}</p>
                </div>
              </div>

              <div className='space-y-2 rounded-lg border p-4'>
                <div className='flex justify-between text-sm'>
                  <span className='text-muted-foreground'>Subtotal</span>
                  <span>{formatINR(selectedBooking.subtotal || 0)}</span>
                </div>
                <div className='flex justify-between text-sm'>
                  <span className='text-muted-foreground'>Service Fee</span>
                  <span>{formatINR(selectedBooking.service_fee || 0)}</span>
                </div>
                <div className='border-t pt-2 flex justify-between font-bold'>
                  <span>Total</span>
                  <span>{formatINR(selectedBooking.total || 0)}</span>
                </div>
                {selectedBooking.registration_fee_paid > 0 && (
                  <>
                    <div className='border-t pt-2 flex justify-between text-sm'>
                      <span className='text-muted-foreground'>Registration Fee Paid</span>
                      <span className='text-emerald-600 font-medium'>{formatINR(selectedBooking.registration_fee_paid)}</span>
                    </div>
                    <div className='flex justify-between text-sm'>
                      <span className='text-muted-foreground'>Remaining Balance</span>
                      <span className='text-orange-600 font-medium'>{formatINR(selectedBooking.remaining_balance || 0)}</span>
                    </div>
                  </>
                )}
                {selectedBooking.transaction_id && (
                  <div className='flex justify-between text-sm'>
                    <span className='text-muted-foreground'>Transaction ID</span>
                    <span className='font-mono text-xs'>{selectedBooking.transaction_id}</span>
                  </div>
                )}
                <div className='flex justify-between text-sm'>
                  <span className='text-muted-foreground'>Payment Method</span>
                  <Badge variant='outline'>{selectedBooking.payment_method || 'N/A'}</Badge>
                </div>
                {selectedBooking.order_id && (
                  <div className='flex justify-between text-sm'>
                    <span className='text-muted-foreground'>Order ID</span>
                    <span className='font-mono text-xs'>{selectedBooking.order_id}</span>
                  </div>
                )}
                {selectedBooking.payment_id && (
                  <div className='flex justify-between text-sm'>
                    <span className='text-muted-foreground'>Payment ID</span>
                    <span className='font-mono text-xs'>{selectedBooking.payment_id}</span>
                  </div>
                )}
                {selectedBooking.paid_at && (
                  <div className='flex justify-between text-sm'>
                    <span className='text-muted-foreground'>Paid At</span>
                    <span>{new Date(selectedBooking.paid_at).toLocaleString()}</span>
                  </div>
                )}
              </div>

              {selectedBooking.status === 'pre_booked' && (
                <div className='flex gap-2'>
                  <Button
                    className='flex-1'
                    onClick={() => {
                      setConfirmPaymentDialogOpen(true)
                      setDetailDialogOpen(false)
                    }}
                  >
                    <CheckCircle className='mr-2 h-4 w-4' />
                    Confirm Full Payment
                  </Button>
                  <Button
                    variant='destructive'
                    className='flex-1'
                    onClick={() => {
                      handleStatusChange(selectedBooking.id, 'cancelled')
                      setDetailDialogOpen(false)
                    }}
                  >
                    <XCircle className='mr-2 h-4 w-4' />
                    Cancel
                  </Button>
                </div>
              )}

              {selectedBooking.status === 'pending' && (
                <div className='flex gap-2'>
                  <Button
                    className='flex-1'
                    onClick={() => {
                      handleStatusChange(selectedBooking.id, 'confirmed')
                      setDetailDialogOpen(false)
                    }}
                  >
                    <CheckCircle className='mr-2 h-4 w-4' />
                    Confirm
                  </Button>
                  <Button
                    variant='destructive'
                    className='flex-1'
                    onClick={() => {
                      handleStatusChange(selectedBooking.id, 'cancelled')
                      setDetailDialogOpen(false)
                    }}
                  >
                    <XCircle className='mr-2 h-4 w-4' />
                    Cancel
                  </Button>
                </div>
              )}

              {/* Invoice Generation & Sending */}
              {(selectedBooking.status === 'confirmed' || selectedBooking.status === 'pre_booked') && (
                <div className='border-t pt-4 mt-4'>
                  <p className='text-sm font-semibold mb-2'>Receipt & Confirmation</p>
                  <div className='flex flex-wrap gap-2'>
                    <Button
                      variant='outline'
                      size='sm'
                      asChild
                    >
                      <a href={`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/admin/bookings/${selectedBooking.id}/download-invoice?token=${localStorage.getItem('token') || ''}`} target='_blank' rel='noreferrer'>📥 Download Receipt</a>
                    </Button>
                    <Button
                      size='sm'
                      onClick={async () => {
                        try {
                          const { sendVenueInvoice } = await import('@/lib/api')
                          await sendVenueInvoice(selectedBooking.id)
                          toast.success('Confirmation + Receipt sent to customer via WhatsApp!')
                        } catch (err: any) {
                          toast.error(err.response?.data?.error || 'Failed to send')
                        }
                      }}
                    >
                      📨 Send Confirmation + Receipt
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Booking</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this booking? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant='outline' onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant='destructive'
              onClick={() => selectedBooking && deleteMutation.mutate(selectedBooking.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Payment Dialog */}
      <Dialog open={confirmPaymentDialogOpen} onOpenChange={(open) => { setConfirmPaymentDialogOpen(open); if (!open) { setTransactionId(''); setTxnError(''); } }}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle>Confirm Full Payment</DialogTitle>
            <DialogDescription>
              Enter the transaction ID to confirm the remaining balance has been received.
            </DialogDescription>
          </DialogHeader>
          {selectedBooking && (
            <div className='space-y-4'>
              <div className='rounded-lg bg-muted p-3 space-y-1 text-sm'>
                <p><span className='text-muted-foreground'>Venue:</span> <span className='font-medium'>{selectedBooking.venue?.name}</span></p>
                <p><span className='text-muted-foreground'>Customer:</span> <span className='font-medium'>{selectedBooking.user?.full_name}</span></p>
                <p><span className='text-muted-foreground'>Registration Fee Paid:</span> <span className='font-medium text-emerald-600'>{formatINR(selectedBooking.registration_fee_paid || 0)}</span></p>
                <p><span className='text-muted-foreground'>Remaining Balance:</span> <span className='font-medium text-orange-600'>{formatINR(selectedBooking.remaining_balance || 0)}</span></p>
                <p><span className='text-muted-foreground'>Total:</span> <span className='font-bold'>{formatINR(selectedBooking.total || 0)}</span></p>
              </div>
              <div className='space-y-2'>
                <label className='text-sm font-medium'>Transaction ID</label>
                <Input
                  placeholder='Enter the payment transaction ID'
                  value={transactionId}
                  onChange={(e) => { setTransactionId(e.target.value); setTxnError(''); }}
                  maxLength={64}
                />
                {txnError && <p className='text-sm text-destructive'>{txnError}</p>}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant='outline' onClick={() => { setConfirmPaymentDialogOpen(false); setTransactionId(''); setTxnError(''); }}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!transactionId.trim()) { setTxnError('Transaction ID is required'); return; }
                if (!/^[a-zA-Z0-9_-]{1,64}$/.test(transactionId.trim())) { setTxnError('Invalid format. Use 1-64 alphanumeric characters, hyphens, or underscores.'); return; }
                confirmPaymentMutation.mutate()
              }}
              disabled={confirmPaymentMutation.isPending}
            >
              {confirmPaymentMutation.isPending ? 'Confirming...' : 'Confirm Payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
