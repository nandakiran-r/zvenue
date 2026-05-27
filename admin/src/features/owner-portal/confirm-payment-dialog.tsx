import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { confirmBookingPayment } from '@/lib/api'
import { toast } from 'sonner'

const TRANSACTION_ID_REGEX = /^[a-zA-Z0-9_-]{1,64}$/

interface ConfirmPaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  booking: {
    id: string
    venue?: { name?: string }
    booking_date: string
    start_time?: string
    end_time?: string
    total: number
    registration_fee_paid?: number
    remaining_balance?: number
    user?: { full_name?: string; email?: string; phone_number?: string }
  } | null
}

export function ConfirmPaymentDialog({ open, onOpenChange, booking }: ConfirmPaymentDialogProps) {
  const [transactionId, setTransactionId] = useState('')
  const [error, setError] = useState('')
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => confirmBookingPayment(booking!.id, transactionId.trim()),
    onSuccess: () => {
      toast.success('Booking fully confirmed!')
      queryClient.invalidateQueries({ queryKey: ['owner-bookings'] })
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      onOpenChange(false)
      setTransactionId('')
      setError('')
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error || 'Failed to confirm payment'
      setError(msg)
    },
  })

  const handleConfirm = () => {
    setError('')
    if (!transactionId.trim()) {
      setError('Transaction ID is required')
      return
    }
    if (!TRANSACTION_ID_REGEX.test(transactionId.trim())) {
      setError('Invalid format. Use 1-64 alphanumeric characters, hyphens, or underscores.')
      return
    }
    mutation.mutate()
  }

  const handleClose = () => {
    onOpenChange(false)
    setTransactionId('')
    setError('')
  }

  if (!booking) return null

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confirm Full Payment</DialogTitle>
          <DialogDescription>
            Confirm that the remaining balance has been received for this booking.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Booking Summary */}
          <div className="rounded-lg bg-muted p-3 space-y-1 text-sm">
            <p><span className="text-muted-foreground">Venue:</span> <span className="font-medium">{booking.venue?.name || '—'}</span></p>
            <p><span className="text-muted-foreground">Date:</span> <span className="font-medium">{booking.booking_date}</span></p>
            <p><span className="text-muted-foreground">Customer:</span> <span className="font-medium">{booking.user?.full_name || '—'}</span></p>
            {booking.user?.phone_number && (
              <p><span className="text-muted-foreground">Phone:</span> <span className="font-medium">{booking.user.phone_number}</span></p>
            )}
            <div className="border-t pt-2 mt-2 space-y-1">
              <p><span className="text-muted-foreground">Registration Fee Paid:</span> <span className="font-medium text-green-600">₹{(booking.registration_fee_paid || 0).toLocaleString('en-IN')}</span></p>
              <p><span className="text-muted-foreground">Remaining Balance:</span> <span className="font-medium text-orange-600">₹{(booking.remaining_balance || 0).toLocaleString('en-IN')}</span></p>
              <p><span className="text-muted-foreground">Total:</span> <span className="font-bold">₹{(booking.total || 0).toLocaleString('en-IN')}</span></p>
            </div>
          </div>

          {/* Transaction ID Input */}
          <div className="space-y-2">
            <Label htmlFor="transaction-id">Transaction ID</Label>
            <Input
              id="transaction-id"
              placeholder="Enter the payment transaction ID"
              value={transactionId}
              onChange={(e) => { setTransactionId(e.target.value); setError(''); }}
              maxLength={64}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={mutation.isPending}>
            {mutation.isPending ? 'Confirming...' : 'Confirm Payment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
