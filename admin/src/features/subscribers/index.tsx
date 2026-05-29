import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Search as SearchIcon,
  Crown,
  UserX,
  UserCheck,
  Mail,
  Phone,
  CalendarCheck,
  Plus,
  Trash2,
  Save,
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
import { fetchSubscribers, cancelUserSubscription, activateUserSubscription, fetchSubscriptionBenefits, updateSubscriptionBenefits } from '@/lib/api'

export function SubscribersPage() {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [actionDialogOpen, setActionDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [actionType, setActionType] = useState<'cancel' | 'activate'>('cancel')

  // Subscription benefits editor state
  const [benefits, setBenefits] = useState<string[]>([])
  const [newBenefit, setNewBenefit] = useState('')
  const [benefitsSaving, setBenefitsSaving] = useState(false)

  const { data: benefitsData } = useQuery({
    queryKey: ['subscription-benefits'],
    queryFn: fetchSubscriptionBenefits,
  })

  useEffect(() => {
    if (benefitsData?.benefits) {
      setBenefits(benefitsData.benefits)
    }
  }, [benefitsData])

  const saveBenefits = async () => {
    setBenefitsSaving(true)
    try {
      await updateSubscriptionBenefits(benefits)
      queryClient.invalidateQueries({ queryKey: ['subscription-benefits'] })
      toast.success('Subscription benefits updated')
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save')
    } finally {
      setBenefitsSaving(false)
    }
  }

  const addBenefit = () => {
    if (newBenefit.trim()) {
      setBenefits([...benefits, newBenefit.trim()])
      setNewBenefit('')
    }
  }

  const removeBenefit = (index: number) => {
    setBenefits(benefits.filter((_, i) => i !== index))
  }

  const { data: subscribers, isLoading } = useQuery({
    queryKey: ['admin-subscribers', statusFilter, search],
    queryFn: () =>
      fetchSubscribers({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: search || undefined,
      }),
    refetchInterval: 10000,
  })

  const cancelMutation = useMutation({
    mutationFn: (id: string) => cancelUserSubscription(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-subscribers'] })
      setActionDialogOpen(false)
      toast.success('Subscription cancelled successfully')
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to cancel'),
  })

  const activateMutation = useMutation({
    mutationFn: (id: string) => activateUserSubscription(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-subscribers'] })
      setActionDialogOpen(false)
      toast.success('Subscription activated successfully')
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to activate'),
  })

  const handleAction = (user: any, type: 'cancel' | 'activate') => {
    setSelectedUser(user)
    setActionType(type)
    setActionDialogOpen(true)
  }

  const confirmAction = () => {
    if (!selectedUser) return
    if (actionType === 'cancel') {
      cancelMutation.mutate(selectedUser.id)
    } else {
      activateMutation.mutate(selectedUser.id)
    }
  }

  const activeCount = (subscribers || []).filter((u: any) => u.is_subscribed).length
  const freeCount = (subscribers || []).filter((u: any) => !u.is_subscribed).length

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
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
            <h2 className='text-2xl font-bold tracking-tight'>Subscribers</h2>
            <p className='text-muted-foreground'>
              Manage user subscriptions and access
            </p>
          </div>
          <div className='flex gap-2'>
            <Badge variant='default' className='text-sm gap-1'>
              <Crown className='h-3 w-3' />
              {activeCount} Active
            </Badge>
            <Badge variant='secondary' className='text-sm gap-1'>
              <UserX className='h-3 w-3' />
              {freeCount} Free
            </Badge>
          </div>
        </div>

        {/* Filters */}
        <div className='flex flex-wrap gap-3'>
          <div className='relative flex-1 min-w-[200px] max-w-sm'>
            <SearchIcon className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
            <Input
              placeholder='Search by name, email, or phone...'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className='pl-9'
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className='w-[180px]'>
              <SelectValue placeholder='All Users' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Users</SelectItem>
              <SelectItem value='active'>Subscribed</SelectItem>
              <SelectItem value='free'>Free Users</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card>
          <CardContent className='p-0'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead className='text-center'>Bookings</TableHead>
                  <TableHead className='text-center'>Status</TableHead>
                  <TableHead>Subscription ID</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className='text-right'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 7 }).map((_, j) => (
                          <TableCell key={j}><Skeleton className='h-4 w-20' /></TableCell>
                        ))}
                      </TableRow>
                    ))
                  : (subscribers || []).map((user: any) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className='flex items-center gap-3'>
                            <Avatar className='h-9 w-9'>
                              <AvatarImage src={user.avatar_url} />
                              <AvatarFallback>
                                {(user.full_name || 'U')[0].toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className='text-sm font-medium'>{user.full_name || '—'}</p>
                              <p className='text-xs text-muted-foreground'>{user.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className='flex items-center gap-1 text-sm'>
                            <Phone className='h-3 w-3 text-muted-foreground' />
                            {user.phone_number || '—'}
                          </div>
                        </TableCell>
                        <TableCell className='text-center'>
                          <Badge variant='secondary'>{user.booking_count}</Badge>
                        </TableCell>
                        <TableCell className='text-center'>
                          {user.is_subscribed ? (
                            <Badge className='bg-amber-100 text-amber-800 hover:bg-amber-100 gap-1'>
                              <Crown className='h-3 w-3' /> Pro
                            </Badge>
                          ) : (
                            <Badge variant='outline'>Free</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className='text-xs font-mono text-muted-foreground'>
                            {user.subscription_id ? user.subscription_id.slice(0, 16) + '...' : '—'}
                          </span>
                        </TableCell>
                        <TableCell className='text-sm text-muted-foreground'>
                          {formatDate(user.created_at)}
                        </TableCell>
                        <TableCell>
                          <div className='flex items-center justify-end gap-1'>
                            {user.is_subscribed ? (
                              <Button
                                variant='ghost'
                                size='sm'
                                className='text-red-600 hover:text-red-700'
                                onClick={() => handleAction(user, 'cancel')}
                              >
                                <UserX className='h-4 w-4 mr-1' />
                                Cancel
                              </Button>
                            ) : (
                              <Button
                                variant='ghost'
                                size='sm'
                                className='text-emerald-600 hover:text-emerald-700'
                                onClick={() => handleAction(user, 'activate')}
                              >
                                <UserCheck className='h-4 w-4 mr-1' />
                                Activate
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                {!isLoading && (subscribers || []).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className='h-24 text-center text-muted-foreground'>
                      No users found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Subscription Benefits Editor */}
        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between mb-4'>
              <div>
                <h3 className='text-lg font-semibold'>Subscription Benefits</h3>
                <p className='text-sm text-muted-foreground'>Edit the benefits shown to users on the subscription page</p>
              </div>
              <Button onClick={saveBenefits} disabled={benefitsSaving} size='sm'>
                <Save className='h-4 w-4 mr-1' />
                {benefitsSaving ? 'Saving...' : 'Save'}
              </Button>
            </div>

            <div className='space-y-2 mb-4'>
              {benefits.map((benefit, index) => (
                <div key={index} className='flex items-center gap-2 p-2 rounded-lg border bg-muted/30'>
                  <span className='text-sm flex-1'>{benefit}</span>
                  <Button variant='ghost' size='sm' className='h-7 w-7 p-0 text-red-500 hover:text-red-700' onClick={() => removeBenefit(index)}>
                    <Trash2 className='h-3.5 w-3.5' />
                  </Button>
                </div>
              ))}
              {benefits.length === 0 && (
                <p className='text-sm text-muted-foreground italic py-4 text-center'>No benefits added yet</p>
              )}
            </div>

            <div className='flex gap-2'>
              <Input
                placeholder='Add a new benefit...'
                value={newBenefit}
                onChange={(e) => setNewBenefit(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addBenefit()}
                className='flex-1'
              />
              <Button variant='outline' size='sm' onClick={addBenefit} disabled={!newBenefit.trim()}>
                <Plus className='h-4 w-4 mr-1' /> Add
              </Button>
            </div>
          </CardContent>
        </Card>
      </Main>

      {/* Action Confirmation Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'cancel' ? 'Cancel Subscription' : 'Activate Subscription'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'cancel'
                ? `Are you sure you want to cancel the subscription for "${selectedUser?.full_name || selectedUser?.email}"? They will lose access to premium benefits.`
                : `Activate premium subscription for "${selectedUser?.full_name || selectedUser?.email}"? They will get access to all subscriber benefits.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant='outline' onClick={() => setActionDialogOpen(false)}>
              Go Back
            </Button>
            <Button
              variant={actionType === 'cancel' ? 'destructive' : 'default'}
              onClick={confirmAction}
              disabled={cancelMutation.isPending || activateMutation.isPending}
            >
              {(cancelMutation.isPending || activateMutation.isPending)
                ? 'Processing...'
                : actionType === 'cancel' ? 'Cancel Subscription' : 'Activate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
