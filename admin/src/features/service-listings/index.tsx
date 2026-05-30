import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Check, X, ShoppingBag } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Label } from '@/components/ui/label'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ConfigDrawer } from '@/components/config-drawer'
import { fetchServiceListings, fetchServiceCategories, fetchOwners, createServiceListing, updateServiceListing, approveServiceListing, rejectServiceListing, deleteServiceListing } from '@/lib/api'

function approvalBadge(status: string) {
  if (status === 'approved') return <Badge className='bg-emerald-100 text-emerald-700 hover:bg-emerald-100'>Approved</Badge>
  if (status === 'pending_review') return <Badge className='bg-amber-100 text-amber-700 hover:bg-amber-100'>Pending</Badge>
  if (status === 'pending_changes') return <Badge className='bg-blue-100 text-blue-700 hover:bg-blue-100'>Changes Pending</Badge>
  if (status === 'rejected') return <Badge variant='destructive'>Rejected</Badge>
  return <Badge variant='outline'>{status}</Badge>
}

export function ServiceListingsPage() {
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [form, setForm] = useState({ name: '', service_category_id: '', owner_id: '', description: '', images: [] as string[], video_url: '', price: 0, quantity_available: 0, city: '', area: '', subscriber_discount_percent: 0, subscriber_benefits: [] as string[], owner_name: '', owner_image: '', opening_time: '00:00', closing_time: '23:30', max_booking_duration: 1440, blocked_slots: [] as { date: string; start: string; end: string }[] })
  const [benefitInput, setBenefitInput] = useState('')

  const { data: listings, isLoading } = useQuery({ queryKey: ['service-listings', filterCategory], queryFn: () => fetchServiceListings(filterCategory !== 'all' ? { category_id: filterCategory } : {}) })
  const { data: categories } = useQuery({ queryKey: ['service-categories-list'], queryFn: fetchServiceCategories })
  const { data: owners } = useQuery({ queryKey: ['owners-list'], queryFn: fetchOwners })

  const createMut = useMutation({ mutationFn: (d: Record<string, unknown>) => createServiceListing(d), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['service-listings'] }); setDialogOpen(false); toast.success('Listing created') } })
  const updateMut = useMutation({ mutationFn: ({ id, d }: { id: string; d: Record<string, unknown> }) => updateServiceListing(id, d), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['service-listings'] }); setDialogOpen(false); toast.success('Listing updated') } })
  const approveMut = useMutation({ mutationFn: (id: string) => approveServiceListing(id), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['service-listings'] }); toast.success('Approved') } })
  const rejectMut = useMutation({ mutationFn: (id: string) => rejectServiceListing(id), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['service-listings'] }); toast.success('Rejected') } })
  const deleteMut = useMutation({ mutationFn: (id: string) => deleteServiceListing(id), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['service-listings'] }); toast.success('Deleted') } })

  const handleSubmit = () => {
    const payload = { ...form, price: Number(form.price), quantity_available: Number(form.quantity_available), subscriber_discount_percent: Number(form.subscriber_discount_percent), max_booking_duration: Number(form.max_booking_duration) }
    if (editMode && selectedId) updateMut.mutate({ id: selectedId, d: payload })
    else createMut.mutate(payload)
  }

  const openEdit = (item: any) => {
    setSelectedId(item.id); setEditMode(true)
    setForm({ name: item.name || '', service_category_id: item.service_category_id || '', owner_id: item.owner_id || '', description: item.description || '', images: item.images || [], video_url: item.video_url || '', price: item.price || 0, quantity_available: item.quantity_available || 0, city: item.city || '', area: item.area || '', subscriber_discount_percent: item.subscriber_discount_percent || 0, subscriber_benefits: item.subscriber_benefits || [], owner_name: item.owner_name || '', owner_image: item.owner_image || '', opening_time: item.opening_time || '00:00', closing_time: item.closing_time || '23:30', max_booking_duration: item.max_booking_duration || 1440, blocked_slots: item.blocked_slots || [] })
    setDialogOpen(true)
  }

  const formatINR = (n: number) => `₹${(n || 0).toLocaleString('en-IN')}`

  return (
    <>
      <Header fixed><Search className='me-auto' /><ThemeSwitch /><ConfigDrawer /><ProfileDropdown /></Header>
      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div className='flex flex-wrap items-end justify-between gap-2'>
          <div><h2 className='text-2xl font-bold'>Service Listings</h2><p className='text-muted-foreground'>Manage service marketplace listings</p></div>
          <div className='flex gap-2'>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className='w-[180px]'><SelectValue placeholder='All Categories' /></SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Categories</SelectItem>
                {(categories || []).map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button onClick={() => { setEditMode(false); setSelectedId(null); setForm({ name: '', service_category_id: '', owner_id: '', description: '', images: [], video_url: '', price: 0, quantity_available: 0, city: '', area: '', subscriber_discount_percent: 0, subscriber_benefits: [], owner_name: '', owner_image: '', opening_time: '00:00', closing_time: '23:30', max_booking_duration: 1440, blocked_slots: [] }); setDialogOpen(true) }}>
              <Plus className='mr-2 h-4 w-4' />Add Listing
            </Button>
          </div>
        </div>

        <Card><CardContent className='p-0'>
          <Table>
            <TableHeader><TableRow><TableHead></TableHead><TableHead>Name</TableHead><TableHead>Category</TableHead><TableHead>Price</TableHead><TableHead>Qty</TableHead><TableHead>Rating</TableHead><TableHead>Status</TableHead><TableHead className='text-right'>Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {isLoading ? Array.from({ length: 5 }).map((_, i) => <TableRow key={i}>{Array.from({ length: 8 }).map((_, j) => <TableCell key={j}><Skeleton className='h-4 w-16' /></TableCell>)}</TableRow>) :
              (listings || []).map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell><Avatar className='h-10 w-10 rounded-lg'><AvatarImage src={item.images?.[0]} className='object-cover' /><AvatarFallback className='rounded-lg'><ShoppingBag className='h-4 w-4' /></AvatarFallback></Avatar></TableCell>
                  <TableCell><p className='font-medium'>{item.name}</p><p className='text-xs text-muted-foreground'>{item.city}</p></TableCell>
                  <TableCell className='text-sm'>{item.category?.name || '—'}</TableCell>
                  <TableCell className='text-sm'>{formatINR(item.price)}</TableCell>
                  <TableCell className='text-sm'>{item.quantity_available}</TableCell>
                  <TableCell className='text-sm'>⭐ {item.rating?.toFixed(1)} ({item.review_count})</TableCell>
                  <TableCell>{approvalBadge(item.approval_status)}</TableCell>
                  <TableCell>
                    <div className='flex justify-end gap-1'>
                      {(item.approval_status === 'pending_review' || item.approval_status === 'pending_changes') && (
                        <>
                          <Button variant='ghost' size='icon' className='text-emerald-600' onClick={() => approveMut.mutate(item.id)}><Check className='h-4 w-4' /></Button>
                          <Button variant='ghost' size='icon' className='text-destructive' onClick={() => rejectMut.mutate(item.id)}><X className='h-4 w-4' /></Button>
                        </>
                      )}
                      <Button variant='ghost' size='icon' onClick={() => openEdit(item)}><Pencil className='h-4 w-4' /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && (listings || []).length === 0 && <TableRow><TableCell colSpan={8} className='h-24 text-center text-muted-foreground'>No service listings found</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent></Card>
      </Main>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className='max-w-2xl max-h-[85vh] overflow-y-auto'>
          <DialogHeader><DialogTitle>{editMode ? 'Edit Service Listing' : 'New Service Listing'}</DialogTitle></DialogHeader>
          <div className='grid gap-3 py-2'>
            <div className='grid grid-cols-2 gap-3'>
              <div><Label>Name *</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
              <div><Label>City *</Label><Input value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} /></div>
            </div>
            <div className='grid grid-cols-2 gap-3'>
              <div><Label>Category *</Label>
                <Select value={form.service_category_id} onValueChange={v => setForm(p => ({ ...p, service_category_id: v }))}>
                  <SelectTrigger><SelectValue placeholder='Select' /></SelectTrigger>
                  <SelectContent>{(categories || []).map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Owner</Label>
                <Select value={form.owner_id} onValueChange={v => { const o = (owners || []).find((x: any) => x.id === v); setForm(p => ({ ...p, owner_id: v, owner_name: o?.full_name || '', owner_image: o?.avatar_url || '' })); }}>
                  <SelectTrigger><SelectValue placeholder='Select owner' /></SelectTrigger>
                  <SelectContent>{(owners || []).map((o: any) => <SelectItem key={o.id} value={o.id}>{o.full_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} /></div>
            <div className='grid grid-cols-3 gap-3'>
              <div><Label>Price (₹) *</Label><Input type='number' value={form.price} onChange={e => setForm(p => ({ ...p, price: Number(e.target.value) }))} /></div>
              <div><Label>Quantity *</Label><Input type='number' value={form.quantity_available} onChange={e => setForm(p => ({ ...p, quantity_available: Number(e.target.value) }))} /></div>
              <div><Label>Discount %</Label><Input type='number' value={form.subscriber_discount_percent} onChange={e => setForm(p => ({ ...p, subscriber_discount_percent: Math.min(50, Math.max(0, Number(e.target.value))) }))} /></div>
            </div>
            <div><Label>Area</Label><Input value={form.area} onChange={e => setForm(p => ({ ...p, area: e.target.value }))} placeholder='e.g. MG Road' /></div>
            <div><Label>Video URL</Label><Input value={form.video_url} onChange={e => setForm(p => ({ ...p, video_url: e.target.value }))} placeholder='https://youtube.com/...' /></div>
            {/* Time Slot Configuration */}
            <div className='border rounded-lg p-3 space-y-3'>
              <Label className='text-sm font-semibold'>Booking Time Configuration</Label>
              <div className='grid grid-cols-3 gap-3'>
                <div><Label className='text-xs'>Opening Time</Label><Input type='time' value={form.opening_time} onChange={e => setForm(p => ({ ...p, opening_time: e.target.value }))} /></div>
                <div><Label className='text-xs'>Closing Time</Label><Input type='time' value={form.closing_time} onChange={e => setForm(p => ({ ...p, closing_time: e.target.value }))} /></div>
                <div><Label className='text-xs'>Max Duration (min)</Label><Input type='number' value={form.max_booking_duration} onChange={e => setForm(p => ({ ...p, max_booking_duration: Number(e.target.value) }))} step={30} min={30} /></div>
              </div>
            </div>
            {/* Blocked Slots */}
            <div className='border rounded-lg p-3 space-y-3'>
              <Label className='text-sm font-semibold'>Blocked Time Slots</Label>
              {form.blocked_slots.map((slot, i) => (
                <div key={i} className='flex items-center gap-2 text-sm'>
                  <span>{slot.date}</span>
                  <span>{slot.start} – {slot.end}</span>
                  <Button variant='ghost' size='sm' className='h-6 w-6 p-0 text-destructive' onClick={() => setForm(p => ({ ...p, blocked_slots: p.blocked_slots.filter((_, idx) => idx !== i) }))}>&times;</Button>
                </div>
              ))}
              <div className='flex gap-2 items-end'>
                <div><Label className='text-xs'>Date</Label><Input type='date' id='bs-date' className='w-[130px]' /></div>
                <div><Label className='text-xs'>From</Label><Input type='time' id='bs-start' className='w-[110px]' /></div>
                <div><Label className='text-xs'>To</Label><Input type='time' id='bs-end' className='w-[110px]' /></div>
                <Button variant='outline' size='sm' onClick={() => {
                  const d = (document.getElementById('bs-date') as HTMLInputElement)?.value
                  const s = (document.getElementById('bs-start') as HTMLInputElement)?.value
                  const e = (document.getElementById('bs-end') as HTMLInputElement)?.value
                  if (d && s && e) setForm(p => ({ ...p, blocked_slots: [...p.blocked_slots, { date: d, start: s, end: e }] }))
                }}>Add</Button>
              </div>
            </div>
            <div><Label>Subscriber Benefits</Label>
              <div className='flex gap-2'><Input value={benefitInput} onChange={e => setBenefitInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (benefitInput.trim()) { setForm(p => ({ ...p, subscriber_benefits: [...p.subscriber_benefits, benefitInput.trim()] })); setBenefitInput('') } } }} /><Button variant='outline' onClick={() => { if (benefitInput.trim()) { setForm(p => ({ ...p, subscriber_benefits: [...p.subscriber_benefits, benefitInput.trim()] })); setBenefitInput('') } }}>Add</Button></div>
              <div className='flex flex-wrap gap-1 mt-2'>{form.subscriber_benefits.map((b, i) => <Badge key={i} variant='secondary'>{b}<button className='ml-1' onClick={() => setForm(p => ({ ...p, subscriber_benefits: p.subscriber_benefits.filter((_, idx) => idx !== i) }))}>&times;</button></Badge>)}</div>
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={!form.name || !form.service_category_id || !form.price || !form.city}>{editMode ? 'Save' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
