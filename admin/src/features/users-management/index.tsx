import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Search as SearchIcon,
  Users as UsersIcon,
  Mail,
  Phone,
  Calendar,
  Trash2,
  Eye,
  CalendarCheck,
  MapPin,
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
import { fetchUsers, fetchUserDetail, deleteUser } from '@/lib/api'

function formatINR(amount: number) {
  return `₹${amount.toLocaleString('en-IN')}`
}

export function UsersManagementPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [userDetail, setUserDetail] = useState<any>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users', search],
    queryFn: () => fetchUsers({ search: search || undefined }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      setDeleteDialogOpen(false)
      setSelectedUser(null)
      toast.success('User deleted successfully!')
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to delete user'),
  })

  const viewUserDetail = async (user: any) => {
    setSelectedUser(user)
    setDetailLoading(true)
    setDetailDialogOpen(true)
    try {
      const detail = await fetchUserDetail(user.id)
      setUserDetail(detail)
    } catch (err) {
      toast.error('Failed to load user details')
    } finally {
      setDetailLoading(false)
    }
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
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
            <h2 className='text-2xl font-bold tracking-tight'>Users</h2>
            <p className='text-muted-foreground'>
              View and manage registered app users
            </p>
          </div>
          <Badge variant='outline' className='text-sm'>
            <UsersIcon className='mr-1 h-3 w-3' />
            {(users || []).length} users
          </Badge>
        </div>

        {/* Search */}
        <div className='relative max-w-sm'>
          <SearchIcon className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
          <Input
            placeholder='Search by name or email...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='pl-9'
          />
        </div>

        {/* Users Table */}
        <Card>
          <CardContent className='p-0'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='w-12'></TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>DOB</TableHead>
                  <TableHead className='text-center'>Bookings</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className='text-right'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 8 }).map((_, j) => (
                          <TableCell key={j}><Skeleton className='h-4 w-20' /></TableCell>
                        ))}
                      </TableRow>
                    ))
                  : (users || []).map((user: any) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <Avatar className='h-9 w-9'>
                            <AvatarImage src={user.avatar_url} />
                            <AvatarFallback>
                              {(user.full_name || user.email || 'U')[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        </TableCell>
                        <TableCell>
                          <p className='font-medium'>{user.full_name || '—'}</p>
                          <p className='text-xs text-muted-foreground truncate max-w-[150px]'>
                            {user.clerk_id}
                          </p>
                        </TableCell>
                        <TableCell>
                          <div className='flex items-center gap-1'>
                            <Mail className='h-3 w-3 text-muted-foreground' />
                            <span className='text-sm'>{user.email || '—'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className='flex items-center gap-1'>
                            <Phone className='h-3 w-3 text-muted-foreground' />
                            <span className='text-sm'>{user.phone || '—'}</span>
                          </div>
                        </TableCell>
                        <TableCell className='text-sm'>
                          {user.dob ? formatDate(user.dob) : '—'}
                        </TableCell>
                        <TableCell className='text-center'>
                          <Badge variant='secondary'>
                            {user.booking_count || 0}
                          </Badge>
                        </TableCell>
                        <TableCell className='text-sm text-muted-foreground'>
                          {formatDate(user.created_at)}
                        </TableCell>
                        <TableCell>
                          <div className='flex items-center justify-end gap-1'>
                            <Button
                              variant='ghost'
                              size='icon'
                              onClick={() => viewUserDetail(user)}
                            >
                              <Eye className='h-4 w-4' />
                            </Button>
                            <Button
                              variant='ghost'
                              size='icon'
                              className='text-destructive'
                              onClick={() => {
                                setSelectedUser(user)
                                setDeleteDialogOpen(true)
                              }}
                            >
                              <Trash2 className='h-4 w-4' />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                {!isLoading && (users || []).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className='h-24 text-center text-muted-foreground'>
                      No users found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </Main>

      {/* User Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className='max-w-lg max-h-[85vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>User Profile</DialogTitle>
          </DialogHeader>
          {detailLoading ? (
            <div className='space-y-4'>
              <div className='flex items-center gap-4'>
                <Skeleton className='h-16 w-16 rounded-full' />
                <div className='space-y-2'>
                  <Skeleton className='h-5 w-32' />
                  <Skeleton className='h-4 w-48' />
                </div>
              </div>
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className='h-16 w-full' />
              ))}
            </div>
          ) : userDetail ? (
            <div className='space-y-4'>
              <div className='flex items-center gap-4'>
                <Avatar className='h-16 w-16'>
                  <AvatarImage src={userDetail.avatar_url} />
                  <AvatarFallback className='text-lg'>
                    {(userDetail.full_name || 'U')[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className='text-lg font-bold'>{userDetail.full_name || 'Unknown'}</h3>
                  <p className='text-sm text-muted-foreground'>{userDetail.email}</p>
                </div>
              </div>

              <div className='grid grid-cols-2 gap-3'>
                <div className='rounded-lg bg-muted p-3'>
                  <div className='flex items-center gap-2 mb-1'>
                    <Phone className='h-3 w-3 text-muted-foreground' />
                    <p className='text-xs text-muted-foreground'>Phone</p>
                  </div>
                  <p className='text-sm font-medium'>{userDetail.phone || '—'}</p>
                </div>
                <div className='rounded-lg bg-muted p-3'>
                  <div className='flex items-center gap-2 mb-1'>
                    <Calendar className='h-3 w-3 text-muted-foreground' />
                    <p className='text-xs text-muted-foreground'>DOB</p>
                  </div>
                  <p className='text-sm font-medium'>
                    {userDetail.dob ? formatDate(userDetail.dob) : '—'}
                  </p>
                </div>
                <div className='rounded-lg bg-muted p-3'>
                  <div className='flex items-center gap-2 mb-1'>
                    <CalendarCheck className='h-3 w-3 text-muted-foreground' />
                    <p className='text-xs text-muted-foreground'>Joined</p>
                  </div>
                  <p className='text-sm font-medium'>{formatDate(userDetail.created_at)}</p>
                </div>
                <div className='rounded-lg bg-muted p-3'>
                  <div className='flex items-center gap-2 mb-1'>
                    <UsersIcon className='h-3 w-3 text-muted-foreground' />
                    <p className='text-xs text-muted-foreground'>Clerk ID</p>
                  </div>
                  <p className='text-sm font-medium truncate'>{userDetail.clerk_id}</p>
                </div>
              </div>

              {/* User's Bookings */}
              {(userDetail.bookings || []).length > 0 && (
                <div>
                  <h4 className='text-sm font-semibold mb-3'>
                    Booking History ({userDetail.bookings.length})
                  </h4>
                  <div className='space-y-2 max-h-[200px] overflow-y-auto'>
                    {userDetail.bookings.map((booking: any) => (
                      <div
                        key={booking.id}
                        className='flex items-center gap-3 rounded-lg border p-3'
                      >
                        <Avatar className='h-10 w-10 rounded-md'>
                          <AvatarImage
                            src={booking.venue?.image_url}
                            className='object-cover'
                          />
                          <AvatarFallback className='rounded-md'>V</AvatarFallback>
                        </Avatar>
                        <div className='flex-1'>
                          <p className='text-sm font-medium'>{booking.venue?.name}</p>
                          <p className='text-xs text-muted-foreground flex items-center gap-1'>
                            <MapPin className='h-3 w-3' />
                            {booking.venue?.city} · {booking.booking_date}
                          </p>
                        </div>
                        <div className='text-right'>
                          <p className='text-sm font-medium'>{formatINR(booking.total)}</p>
                          <Badge
                            variant={
                              booking.status === 'confirmed'
                                ? 'default'
                                : booking.status === 'pending'
                                  ? 'secondary'
                                  : 'destructive'
                            }
                            className='text-[10px]'
                          >
                            {booking.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedUser?.full_name || selectedUser?.email}"?
              This will also remove all their associated data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant='outline' onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant='destructive'
              onClick={() => selectedUser && deleteMutation.mutate(selectedUser.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
