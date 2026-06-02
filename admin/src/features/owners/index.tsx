import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Search as SearchIcon,
  UserPlus,
  Building2,
  Trash2,
  CheckCircle,
  XCircle,
  Shield,
  ShieldOff,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { fetchOwners, createOwner, updateOwner, deleteOwner, fetchVenues, approveVenue, rejectVenue } from '@/lib/api'

export function OwnersPage() {
  const queryClient = useQueryClient()
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedOwner, setSelectedOwner] = useState<any>(null)
  const [form, setForm] = useState({ full_name: '', email: '', phone_number: '', password: '' })

  const { data: ownersList, isLoading } = useQuery({
    queryKey: ['admin-owners'],
    queryFn: fetchOwners,
  })

  // Pending venues for approval
  const { data: allVenues } = useQuery({
    queryKey: ['admin-venues-all'],
    queryFn: () => fetchVenues({ all: 'true' } as any),
  })
  const pendingVenues = (allVenues || []).filter((v: any) => v.approval_status === 'pending_review' || v.approval_status === 'pending_changes')

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => createOwner(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-owners'] })
      setCreateDialogOpen(false)
      setForm({ full_name: '', email: '', phone_number: '', password: '' })
      toast.success('Owner account created!')
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to create owner'),
  })

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) => updateOwner(id, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-owners'] })
      toast.success('Owner status updated')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteOwner(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-owners'] })
      setDeleteDialogOpen(false)
      toast.success('Owner deleted')
    },
  })

  const approveMutation = useMutation({
    mutationFn: (id: string) => approveVenue(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-venues-all'] })
      queryClient.invalidateQueries({ queryKey: ['admin-owners'] })
      toast.success('Venue approved and published!')
    },
  })

  const rejectMutation = useMutation({
    mutationFn: (id: string) => rejectVenue(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-venues-all'] })
      toast.success('Venue rejected')
    },
  })

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
            <h2 className='text-2xl font-bold tracking-tight'>Venue Owners</h2>
            <p className='text-muted-foreground'>Manage owner accounts and approve venues</p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <UserPlus className='mr-2 h-4 w-4' /> Add Owner
          </Button>
        </div>

        {/* Pending Approvals */}
        {pendingVenues.length > 0 && (
          <Card className='border-amber-200 bg-amber-50/50'>
            <CardContent className='p-4'>
              <h3 className='font-semibold text-amber-800 mb-3 flex items-center gap-2'>
                <Building2 className='h-4 w-4' />
                Pending Venue Approvals ({pendingVenues.length})
              </h3>
              <div className='space-y-2'>
                {pendingVenues.map((venue: any) => (
                  <div key={venue.id} className='flex items-center justify-between rounded-lg border bg-white p-3'>
                    <div>
                      <p className='font-medium text-sm'>{venue.name}</p>
                      <p className='text-xs text-muted-foreground'>
                        {venue.city} · by {venue.owner?.full_name || 'Unknown'} ·
                        <Badge variant='outline' className='ml-1 text-[10px]'>
                          {venue.approval_status === 'pending_changes' ? 'Changes Pending' : 'New Submission'}
                        </Badge>
                      </p>
                    </div>
                    <div className='flex gap-1'>
                      <Button size='sm' variant='ghost' className='text-emerald-600' onClick={() => approveMutation.mutate(venue.id)}>
                        <CheckCircle className='h-4 w-4 mr-1' /> Approve
                      </Button>
                      <Button size='sm' variant='ghost' className='text-red-500' onClick={() => rejectMutation.mutate(venue.id)}>
                        <XCircle className='h-4 w-4 mr-1' /> Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Owners Table */}
        <Card>
          <CardContent className='p-0'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Owner</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead className='text-center'>Venues</TableHead>
                  <TableHead className='text-center'>Status</TableHead>
                  <TableHead className='text-right'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>{Array.from({ length: 6 }).map((_, j) => <TableCell key={j}><Skeleton className='h-4 w-20' /></TableCell>)}</TableRow>
                )) : (ownersList || []).map((owner: any) => (
                  <TableRow key={owner.id}>
                    <TableCell>
                      <div className='flex items-center gap-3'>
                        <Avatar className='h-9 w-9'>
                          <AvatarImage src={owner.avatar_url} />
                          <AvatarFallback>{(owner.full_name || 'O')[0].toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <p className='font-medium text-sm'>{owner.full_name}</p>
                      </div>
                    </TableCell>
                    <TableCell className='text-sm'>{owner.email}</TableCell>
                    <TableCell className='text-sm'>
                      {owner.phone_number ? (
                        <a href={`https://wa.me/${owner.phone_number.replace(/[^0-9]/g, '')}`} target='_blank' rel='noreferrer' className='text-green-600 hover:underline'>
                          {owner.phone_number}
                        </a>
                      ) : '—'}
                    </TableCell>
                    <TableCell className='text-center'>
                      <Badge variant='secondary'>{owner.venues?.length || 0}</Badge>
                    </TableCell>
                    <TableCell className='text-center'>
                      {owner.is_active ? (
                        <Badge className='bg-emerald-100 text-emerald-700 hover:bg-emerald-100'>Active</Badge>
                      ) : (
                        <Badge variant='destructive'>Disabled</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className='flex items-center justify-end gap-1'>
                        <Button variant='ghost' size='icon' onClick={() => toggleActiveMutation.mutate({ id: owner.id, is_active: !owner.is_active })}>
                          {owner.is_active ? <ShieldOff className='h-4 w-4 text-amber-600' /> : <Shield className='h-4 w-4 text-emerald-600' />}
                        </Button>
                        <Button variant='ghost' size='icon' className='text-destructive' onClick={() => { setSelectedOwner(owner); setDeleteDialogOpen(true); }}>
                          <Trash2 className='h-4 w-4' />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {!isLoading && (ownersList || []).length === 0 && (
                  <TableRow><TableCell colSpan={6} className='h-24 text-center text-muted-foreground'>No owners yet</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </Main>

      {/* Create Owner Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Owner Account</DialogTitle>
            <DialogDescription>The owner will use these credentials to log in and manage their venues.</DialogDescription>
          </DialogHeader>
          <div className='space-y-3'>
            <Input placeholder='Full Name' value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />
            <Input placeholder='Email' type='email' value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            <Input placeholder='Phone Number' value={form.phone_number} onChange={e => setForm(f => ({ ...f, phone_number: e.target.value }))} />
            <Input placeholder='Password' type='password' value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => createMutation.mutate(form)} disabled={createMutation.isPending || !form.full_name.trim() || !form.email.trim() || !form.phone_number.trim() || form.password.length < 6}>
              {createMutation.isPending ? 'Creating...' : 'Create Owner'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Owner</DialogTitle>
            <DialogDescription>Delete "{selectedOwner?.full_name}"? Their venues will remain but become unassigned.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant='outline' onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant='destructive' onClick={() => selectedOwner && deleteMutation.mutate(selectedOwner.id)} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
