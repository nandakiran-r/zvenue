import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Building2,
  Plus,
  Search as SearchIcon,
  MapPin,
  Star,
  Users,
  Pencil,
  Trash2,
  Eye,
  X,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
import { Label } from '@/components/ui/label'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import {
  fetchVenues,
  fetchCategories,
  createVenue,
  updateVenue,
  deleteVenue,
  approveVenue,
  rejectVenue,
} from '@/lib/api'
import { ImageUploader } from '@/components/image-uploader'

function formatINR(amount: number) {
  return `₹${(amount || 0).toLocaleString('en-IN')}`
}

function approvalBadge(status: string) {
  switch (status) {
    case 'approved': return <Badge className='bg-emerald-100 text-emerald-700 hover:bg-emerald-100 gap-1'><CheckCircle className='h-3 w-3' />Approved</Badge>
    case 'pending_review': return <Badge className='bg-amber-100 text-amber-700 hover:bg-amber-100 gap-1'><Clock className='h-3 w-3' />Pending Review</Badge>
    case 'pending_changes': return <Badge className='bg-blue-100 text-blue-700 hover:bg-blue-100 gap-1'><Clock className='h-3 w-3' />Changes Pending</Badge>
    case 'rejected': return <Badge variant='destructive' className='gap-1'><XCircle className='h-3 w-3' />Rejected</Badge>
    default: return <Badge variant='outline'>{status || 'N/A'}</Badge>
  }
}

const defaultVenueForm = {
  name: '', description: '', location: '', city: '', category_id: '', image_url: '',
  price_per_hour: 0, price_per_day: 0, capacity: 0, registration_fee: 0, rating: 0, review_count: 0,
  area: '', amenities: [] as string[], subscriber_benefits: [] as string[], owner_name: '', owner_image: '', available_dates: [] as string[],
  images: [] as string[], youtube_url: '', blocked_dates: [] as string[],
}

export function VenuesPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [approvalFilter, setApprovalFilter] = useState<string>('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [selectedVenue, setSelectedVenue] = useState<any>(null)
  const [form, setForm] = useState(defaultVenueForm)
  const [amenityInput, setAmenityInput] = useState('')
  const [benefitInput, setBenefitInput] = useState('')
  const [rejectReason, setRejectReason] = useState('')

  const { data: venues, isLoading } = useQuery({
    queryKey: ['admin-venues', search, categoryFilter],
    queryFn: () => fetchVenues({ search: search || undefined, category_id: categoryFilter !== 'all' ? categoryFilter : undefined }),
  })

  const { data: categories } = useQuery({ queryKey: ['admin-categories'], queryFn: fetchCategories })

  // Filter by approval status client-side
  const filteredVenues = (venues || []).filter((v: any) => approvalFilter === 'all' || v.approval_status === approvalFilter)
  const pendingCount = (venues || []).filter((v: any) => v.approval_status === 'pending_review' || v.approval_status === 'pending_changes').length

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => createVenue(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-venues'] }); setDialogOpen(false); setForm(defaultVenueForm); toast.success('Venue created!') },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed'),
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => updateVenue(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-venues'] }); setDialogOpen(false); setForm(defaultVenueForm); setEditMode(false); toast.success('Venue updated!') },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed'),
  })
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteVenue(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-venues'] }); setDeleteDialogOpen(false); toast.success('Venue deleted!') },
  })
  const approveMutation = useMutation({
    mutationFn: (id: string) => approveVenue(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-venues'] }); toast.success('Venue approved & published to app!') },
  })
  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => rejectVenue(id, reason),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-venues'] }); setRejectDialogOpen(false); setRejectReason(''); toast.success('Venue rejected. Owner has been notified.') },
  })

  const handleSubmit = () => {
    // Validate required fields
    if (!form.name.trim()) { toast.error('Venue name is required'); return; }
    if (!form.city.trim()) { toast.error('City is required'); return; }
    if (Number(form.price_per_hour) <= 0) { toast.error('Price per hour must be greater than 0'); return; }
    if (Number(form.capacity) <= 0) { toast.error('Capacity must be greater than 0'); return; }
    if (Number(form.registration_fee) <= 0) { toast.error('Registration fee is required'); return; }

    const payload = { ...form, price_per_hour: Number(form.price_per_hour), price_per_day: Number(form.price_per_day), capacity: Number(form.capacity), category_id: form.category_id || null, image_url: form.images[0] || form.image_url || null }
    if (!editMode) { delete (payload as any).rating; delete (payload as any).review_count; }
    if (editMode && selectedVenue) updateMutation.mutate({ id: selectedVenue.id, data: payload })
    else createMutation.mutate(payload)
  }

  const openEdit = (venue: any) => {
    setSelectedVenue(venue); setEditMode(true)
    setForm({ name: venue.name||'', description: venue.description||'', location: venue.location||'', city: venue.city||'', category_id: venue.category_id||'', image_url: venue.image_url||'', price_per_hour: venue.price_per_hour||0, price_per_day: venue.price_per_day||0, capacity: venue.capacity||0, registration_fee: venue.registration_fee||0, rating: venue.rating||0, review_count: venue.review_count||0, area: venue.area||'', amenities: venue.amenities||[], subscriber_benefits: venue.subscriber_benefits||[], owner_name: venue.owner_name||'', owner_image: venue.owner_image||'', available_dates: venue.available_dates||[], images: venue.images||[], youtube_url: venue.youtube_url||'', blocked_dates: venue.blocked_dates||[] })
    setDialogOpen(true)
  }

  const addAmenity = () => { if (amenityInput.trim() && !form.amenities.includes(amenityInput.trim())) { setForm(p => ({ ...p, amenities: [...p.amenities, amenityInput.trim()] })); setAmenityInput('') } }

  return (
    <>
      <Header fixed><Search className='me-auto' /><ThemeSwitch /><ConfigDrawer /><ProfileDropdown /></Header>
      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div className='flex flex-wrap items-end justify-between gap-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Venues</h2>
            <p className='text-muted-foreground'>Manage all venues on the platform</p>
          </div>
          <div className='flex gap-2 items-center'>
            {pendingCount > 0 && <Badge className='bg-amber-100 text-amber-800 hover:bg-amber-100'><AlertTriangle className='h-3 w-3 mr-1' />{pendingCount} pending approval</Badge>}
            <Button onClick={() => { setEditMode(false); setSelectedVenue(null); setForm(defaultVenueForm); setDialogOpen(true) }}><Plus className='mr-2 h-4 w-4' />Add Venue</Button>
          </div>
        </div>

        {/* Filters */}
        <div className='flex flex-wrap gap-3'>
          <div className='relative flex-1 min-w-[200px] max-w-sm'>
            <SearchIcon className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
            <Input placeholder='Search venues...' value={search} onChange={(e) => setSearch(e.target.value)} className='pl-9' />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className='w-[160px]'><SelectValue placeholder='Category' /></SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Categories</SelectItem>
              {(categories || []).map((cat: any) => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={approvalFilter} onValueChange={setApprovalFilter}>
            <SelectTrigger className='w-[180px]'><SelectValue placeholder='Approval Status' /></SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Status</SelectItem>
              <SelectItem value='pending_review'>Pending Review</SelectItem>
              <SelectItem value='pending_changes'>Pending Changes</SelectItem>
              <SelectItem value='approved'>Approved</SelectItem>
              <SelectItem value='rejected'>Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card>
          <CardContent className='p-0'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='w-12'></TableHead>
                  <TableHead>Venue</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead className='text-center'>Status</TableHead>
                  <TableHead className='text-right'>Price/hr</TableHead>
                  <TableHead className='text-center'>Capacity</TableHead>
                  <TableHead className='text-right'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>{Array.from({ length: 8 }).map((_, j) => <TableCell key={j}><Skeleton className='h-4 w-20' /></TableCell>)}</TableRow>
                )) : filteredVenues.map((venue: any) => (
                  <TableRow key={venue.id} className={venue.approval_status === 'pending_review' || venue.approval_status === 'pending_changes' ? 'bg-amber-50/50' : ''}>
                    <TableCell>
                      <Avatar className='h-10 w-10 rounded-lg'>
                        <AvatarImage src={venue.image_url} className='object-cover' />
                        <AvatarFallback className='rounded-lg'><Building2 className='h-4 w-4' /></AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell>
                      <p className='font-medium'>{venue.name}</p>
                      <p className='text-xs text-muted-foreground truncate max-w-[180px]'>{venue.location}</p>
                    </TableCell>
                    <TableCell><div className='flex items-center gap-1'><MapPin className='h-3 w-3 text-muted-foreground' /><span className='text-sm'>{venue.city}</span></div></TableCell>
                    <TableCell><span className='text-sm text-muted-foreground'>{venue.owner?.full_name || '—'}</span></TableCell>
                    <TableCell className='text-center'>{approvalBadge(venue.approval_status)}</TableCell>
                    <TableCell className='text-right font-medium'>{formatINR(venue.price_per_hour)}</TableCell>
                    <TableCell className='text-center'><div className='flex items-center justify-center gap-1'><Users className='h-3 w-3 text-muted-foreground' />{venue.capacity}</div></TableCell>
                    <TableCell>
                      <div className='flex items-center justify-end gap-1'>
                        {/* Approve/Reject for pending venues */}
                        {(venue.approval_status === 'pending_review' || venue.approval_status === 'pending_changes') && (
                          <>
                            <Button variant='ghost' size='icon' className='text-emerald-600' onClick={() => approveMutation.mutate(venue.id)} title='Approve'>
                              <CheckCircle className='h-4 w-4' />
                            </Button>
                            <Button variant='ghost' size='icon' className='text-red-500' onClick={() => { setSelectedVenue(venue); setRejectDialogOpen(true) }} title='Reject'>
                              <XCircle className='h-4 w-4' />
                            </Button>
                          </>
                        )}
                        <Button variant='ghost' size='icon' onClick={() => { setSelectedVenue(venue); setDetailDialogOpen(true) }}><Eye className='h-4 w-4' /></Button>
                        <Button variant='ghost' size='icon' onClick={() => openEdit(venue)}><Pencil className='h-4 w-4' /></Button>
                        <Button variant='ghost' size='icon' className='text-destructive' onClick={() => { setSelectedVenue(venue); setDeleteDialogOpen(true) }}><Trash2 className='h-4 w-4' /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {!isLoading && filteredVenues.length === 0 && (
                  <TableRow><TableCell colSpan={8} className='h-24 text-center text-muted-foreground'>No venues found</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </Main>

      {/* Reject Dialog with Reason */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Venue</DialogTitle>
            <DialogDescription>
              Reject "{selectedVenue?.name}"? The owner will be notified with your reason.
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-3'>
            <Label>Reason for rejection *</Label>
            <Textarea
              placeholder='e.g., Images are unclear, pricing seems incorrect, missing description...'
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => { setRejectDialogOpen(false); setRejectReason('') }}>Cancel</Button>
            <Button
              variant='destructive'
              onClick={() => selectedVenue && rejectMutation.mutate({ id: selectedVenue.id, reason: rejectReason })}
              disabled={!rejectReason.trim() || rejectMutation.isPending}
            >
              {rejectMutation.isPending ? 'Rejecting...' : 'Reject & Notify Owner'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className='max-w-2xl max-h-[85vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>{editMode ? 'Edit Venue' : 'Add New Venue'}</DialogTitle>
          </DialogHeader>
          <div className='grid gap-4 py-4'>
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'><Label>Name *</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
              <div className='space-y-2'><Label>City</Label><Input value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} /></div>
            </div>
            <div className='space-y-2'><Label>Location</Label><Input value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} /></div>
            <div className='space-y-2'><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} /></div>
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'><Label>Category</Label>
                <Select value={form.category_id} onValueChange={val => setForm(p => ({ ...p, category_id: val }))}>
                  <SelectTrigger><SelectValue placeholder='Select' /></SelectTrigger>
                  <SelectContent>{(categories || []).map((cat: any) => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className='space-y-2'><Label>Venue Images (up to 6)</Label>
                <ImageUploader images={form.images} onChange={(imgs) => setForm(p => ({ ...p, images: imgs, image_url: imgs[0] || '' }))} maxImages={6} />
              </div>
            </div>
            <div className='space-y-2'><Label>YouTube Video URL</Label><Input value={form.youtube_url} onChange={e => setForm(p => ({ ...p, youtube_url: e.target.value }))} placeholder='https://youtube.com/watch?v=...' /></div>
            <div className='grid grid-cols-3 gap-4'>
              <div className='space-y-2'><Label>Price/Hour (₹)</Label><Input type='number' value={form.price_per_hour} onChange={e => setForm(p => ({ ...p, price_per_hour: Number(e.target.value) }))} /></div>
              <div className='space-y-2'><Label>Price/Day (₹)</Label><Input type='number' value={form.price_per_day} onChange={e => setForm(p => ({ ...p, price_per_day: Number(e.target.value) }))} /></div>
              <div className='space-y-2'><Label>Capacity</Label><Input type='number' value={form.capacity} onChange={e => setForm(p => ({ ...p, capacity: Number(e.target.value) }))} /></div>
            </div>
            <div className='space-y-2'>
              <Label>Registration Fee (₹) — Amount customer pays to reserve</Label>
              <Input type='number' value={form.registration_fee} onChange={e => setForm(p => ({ ...p, registration_fee: Number(e.target.value) }))} placeholder='e.g., 2000 (0 = full payment)' />
              <p className='text-xs text-muted-foreground'>If set, customer pays only this amount to confirm booking. Balance is paid at venue. Set to 0 for full payment.</p>
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'><Label>Area</Label><Input value={form.area} onChange={e => setForm(p => ({ ...p, area: e.target.value }))} placeholder='5000 sq ft' /></div>
              <div className='space-y-2'><Label>Owner Name</Label><Input value={form.owner_name} onChange={e => setForm(p => ({ ...p, owner_name: e.target.value }))} /></div>
            </div>
            <div className='space-y-2'>
              <Label>Amenities</Label>
              <div className='flex gap-2'>
                <Input value={amenityInput} onChange={e => setAmenityInput(e.target.value)} placeholder='AC, Parking...' onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addAmenity())} />
                <Button type='button' variant='outline' onClick={addAmenity}>Add</Button>
              </div>
              <div className='flex flex-wrap gap-2 mt-2'>
                {form.amenities.map((a, i) => (
                  <Badge key={i} variant='secondary' className='gap-1'>{a}<button onClick={() => setForm(p => ({ ...p, amenities: p.amenities.filter((_, idx) => idx !== i) }))}><X className='h-3 w-3' /></button></Badge>
                ))}
              </div>
            </div>
            <div className='space-y-2'>
              <Label>Subscriber Benefits (Admin only)</Label>
              <p className='text-xs text-muted-foreground'>Premium perks for subscribed users when booking this venue</p>
              <div className='flex gap-2'>
                <Input value={benefitInput} onChange={e => setBenefitInput(e.target.value)} placeholder='Free parking, Welcome drinks...' onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), benefitInput.trim() && (setForm(p => ({ ...p, subscriber_benefits: [...p.subscriber_benefits, benefitInput.trim()] })), setBenefitInput('')))} />
                <Button type='button' variant='outline' onClick={() => { if (benefitInput.trim()) { setForm(p => ({ ...p, subscriber_benefits: [...p.subscriber_benefits, benefitInput.trim()] })); setBenefitInput('') } }}>Add</Button>
              </div>
              <div className='flex flex-wrap gap-2 mt-2'>
                {form.subscriber_benefits.map((b, i) => (
                  <Badge key={i} variant='outline' className='gap-1 bg-amber-50 text-amber-800 border-amber-200'>★ {b}<button onClick={() => setForm(p => ({ ...p, subscriber_benefits: p.subscriber_benefits.filter((_, idx) => idx !== i) }))}><X className='h-3 w-3' /></button></Badge>
                ))}
              </div>
            </div>
            {/* Blocked Dates */}
            <div className='space-y-2 border rounded-lg p-3'>
              <Label className='text-sm font-semibold'>Blocked Dates</Label>
              <p className='text-xs text-muted-foreground'>Dates when this venue is unavailable for booking</p>
              <div className='flex flex-wrap gap-2'>
                {form.blocked_dates.map((date, i) => (
                  <Badge key={i} variant='secondary' className='gap-1'>{date}<button onClick={() => setForm(p => ({ ...p, blocked_dates: p.blocked_dates.filter((_, idx) => idx !== i) }))}><X className='h-3 w-3' /></button></Badge>
                ))}
              </div>
              <div className='flex gap-2'>
                <Input type='date' id='venue-blocked-date' className='w-[160px]' />
                <Button type='button' variant='outline' size='sm' onClick={() => {
                  const d = (document.getElementById('venue-blocked-date') as HTMLInputElement)?.value
                  if (d && !form.blocked_dates.includes(d)) setForm(p => ({ ...p, blocked_dates: [...p.blocked_dates, d] }))
                }}>Add Date</Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={!form.name || createMutation.isPending || updateMutation.isPending}>
              {createMutation.isPending || updateMutation.isPending ? 'Saving...' : editMode ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className='max-w-lg'>
          <DialogHeader><DialogTitle>Venue Details</DialogTitle></DialogHeader>
          {selectedVenue && (
            <div className='space-y-4'>
              {selectedVenue.image_url && <img src={selectedVenue.image_url} alt={selectedVenue.name} className='w-full h-48 object-cover rounded-lg' />}
              <div className='flex items-center justify-between'>
                <h3 className='text-lg font-bold'>{selectedVenue.name}</h3>
                {approvalBadge(selectedVenue.approval_status)}
              </div>
              <p className='text-sm text-muted-foreground'>{selectedVenue.location} · {selectedVenue.city}</p>
              {selectedVenue.owner?.full_name && <p className='text-sm'>Owner: <span className='font-medium'>{selectedVenue.owner.full_name}</span></p>}
              <p className='text-sm'>{selectedVenue.description}</p>
              {selectedVenue.pending_changes && (
                <div className='rounded-lg border-l-4 border-l-blue-400 bg-blue-50 p-3'>
                  <p className='text-sm font-medium text-blue-800 mb-1'>Pending Changes from Owner:</p>
                  <pre className='text-xs text-blue-700 whitespace-pre-wrap'>{JSON.stringify(selectedVenue.pending_changes, null, 2)}</pre>
                </div>
              )}
              <div className='grid grid-cols-3 gap-4 text-center'>
                <div className='rounded-lg bg-muted p-3'><p className='text-xs text-muted-foreground'>Price/hr</p><p className='font-bold'>{formatINR(selectedVenue.price_per_hour)}</p></div>
                <div className='rounded-lg bg-muted p-3'><p className='text-xs text-muted-foreground'>Price/day</p><p className='font-bold'>{formatINR(selectedVenue.price_per_day)}</p></div>
                <div className='rounded-lg bg-muted p-3'><p className='text-xs text-muted-foreground'>Capacity</p><p className='font-bold'>{selectedVenue.capacity}</p></div>
              </div>
              {(selectedVenue.amenities || []).length > 0 && (
                <div><p className='text-sm font-medium mb-2'>Amenities</p><div className='flex flex-wrap gap-2'>{selectedVenue.amenities.map((a: string, i: number) => <Badge key={i} variant='outline'>{a}</Badge>)}</div></div>
              )}
              {(selectedVenue.approval_status === 'pending_review' || selectedVenue.approval_status === 'pending_changes') && (
                <div className='flex gap-2 pt-2'>
                  <Button className='flex-1' onClick={() => { approveMutation.mutate(selectedVenue.id); setDetailDialogOpen(false) }}><CheckCircle className='mr-2 h-4 w-4' />Approve</Button>
                  <Button variant='destructive' className='flex-1' onClick={() => { setDetailDialogOpen(false); setRejectDialogOpen(true) }}><XCircle className='mr-2 h-4 w-4' />Reject</Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Venue</DialogTitle><DialogDescription>Delete "{selectedVenue?.name}"? This cannot be undone.</DialogDescription></DialogHeader>
          <DialogFooter>
            <Button variant='outline' onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant='destructive' onClick={() => selectedVenue && deleteMutation.mutate(selectedVenue.id)} disabled={deleteMutation.isPending}>{deleteMutation.isPending ? 'Deleting...' : 'Delete'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
