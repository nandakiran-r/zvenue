import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Building2, Plus, Pencil, CalendarOff } from 'lucide-react'
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
import { ThemeSwitch } from '@/components/theme-switch'
import { fetchOwnerVenues, createOwnerVenue, updateOwnerVenue, updateOwnerVenueBlockedDates, fetchCategories } from '@/lib/api'
import { ImageUploader } from '@/components/image-uploader'

export function OwnerVenuesPage() {
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [blockDatesDialogOpen, setBlockDatesDialogOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [selectedVenue, setSelectedVenue] = useState<any>(null)
  const [blockDateInput, setBlockDateInput] = useState('')
  const [form, setForm] = useState({ name: '', description: '', location: '', city: '', category_id: '', image_url: '', price_morning: 0, price_evening: 0, price_full_day: 0, capacity: 0, area: '', amenities: [] as string[], images: [] as string[], youtube_url: '' })
  const [amenityInput, setAmenityInput] = useState('')

  const { data: venues, isLoading } = useQuery({ queryKey: ['owner-venues'], queryFn: fetchOwnerVenues })
  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: fetchCategories })

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => createOwnerVenue(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['owner-venues'] }); setDialogOpen(false); toast.success('Venue submitted for review!') },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed'),
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => updateOwnerVenue(id, data),
    onSuccess: (data: any) => { queryClient.invalidateQueries({ queryKey: ['owner-venues'] }); setDialogOpen(false); toast.success(data?.message || 'Venue updated!') },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed'),
  })
  const blockDatesMutation = useMutation({
    mutationFn: ({ id, dates }: { id: string; dates: string[] }) => updateOwnerVenueBlockedDates(id, dates),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['owner-venues'] }); setBlockDatesDialogOpen(false); toast.success('Blocked dates updated!') },
  })

  const handleSubmit = () => {
    const payload = { ...form, price_morning: Number(form.price_morning), price_evening: Number(form.price_evening), price_full_day: Number(form.price_full_day), capacity: Number(form.capacity), category_id: form.category_id || null }
    if (editMode && selectedVenue) updateMutation.mutate({ id: selectedVenue.id, data: payload })
    else createMutation.mutate(payload)
  }

  const openEdit = (venue: any) => {
    setSelectedVenue(venue); setEditMode(true)
    setForm({ name: venue.name||'', description: venue.description||'', location: venue.location||'', city: venue.city||'', category_id: venue.category_id||'', image_url: venue.image_url||'', price_morning: venue.price_morning||0, price_evening: venue.price_evening||0, price_full_day: venue.price_full_day||0, capacity: venue.capacity||0, area: venue.area||'', amenities: venue.amenities||[], images: venue.images||[], youtube_url: venue.youtube_url||'' })
    setDialogOpen(true)
  }

  const openBlockDates = (venue: any) => { setSelectedVenue(venue); setBlockDatesDialogOpen(true) }
  const addBlockedDate = () => {
    if (!blockDateInput || !selectedVenue) return
    const current = selectedVenue.blocked_dates || []
    if (!current.includes(blockDateInput)) {
      const updated = [...current, blockDateInput].sort()
      blockDatesMutation.mutate({ id: selectedVenue.id, dates: updated })
      setSelectedVenue({ ...selectedVenue, blocked_dates: updated })
    }
    setBlockDateInput('')
  }
  const removeBlockedDate = (date: string) => {
    if (!selectedVenue) return
    const updated = (selectedVenue.blocked_dates || []).filter((d: string) => d !== date)
    blockDatesMutation.mutate({ id: selectedVenue.id, dates: updated })
    setSelectedVenue({ ...selectedVenue, blocked_dates: updated })
  }

  function statusBadge(s: string) {
    if (s === 'approved') return <Badge className='bg-emerald-100 text-emerald-700 hover:bg-emerald-100'>Live</Badge>
    if (s === 'pending_review') return <Badge className='bg-amber-100 text-amber-700 hover:bg-amber-100'>Under Review</Badge>
    if (s === 'pending_changes') return <Badge className='bg-blue-100 text-blue-700 hover:bg-blue-100'>Changes Pending</Badge>
    if (s === 'rejected') return <Badge variant='destructive'>Rejected</Badge>
    return <Badge variant='outline'>{s}</Badge>
  }

  return (
    <>
      <Header fixed><ThemeSwitch /><ProfileDropdown /></Header>
      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div className='flex items-end justify-between'>
          <div><h2 className='text-2xl font-bold'>My Venues</h2><p className='text-muted-foreground'>Manage your venue listings</p></div>
          <Button onClick={() => { setEditMode(false); setSelectedVenue(null); setForm({ name:'',description:'',location:'',city:'',category_id:'',image_url:'',price_morning:0,price_evening:0,price_full_day:0,capacity:0,area:'',amenities:[],images:[],youtube_url:'' }); setDialogOpen(true) }}><Plus className='mr-2 h-4 w-4' />Add Venue</Button>
        </div>

        <Card><CardContent className='p-0'>
          <Table>
            <TableHeader><TableRow><TableHead></TableHead><TableHead>Venue</TableHead><TableHead>City</TableHead><TableHead>Status</TableHead><TableHead>Location</TableHead><TableHead>Full Day</TableHead><TableHead className='text-right'>Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {isLoading ? Array.from({length:3}).map((_,i) => <TableRow key={i}>{Array.from({length:7}).map((_,j)=><TableCell key={j}><Skeleton className='h-4 w-20'/></TableCell>)}</TableRow>) :
              (venues||[]).map((v: any) => (
                <TableRow key={v.id}>
                  <TableCell><Avatar className='h-10 w-10 rounded-lg'><AvatarImage src={v.image_url} className='object-cover'/><AvatarFallback className='rounded-lg'><Building2 className='h-4 w-4'/></AvatarFallback></Avatar></TableCell>
                  <TableCell><p className='font-medium'>{v.name}</p></TableCell>
                  <TableCell className='text-sm'>{v.city}</TableCell>
                  <TableCell>{statusBadge(v.approval_status)}</TableCell>
                  <TableCell className='text-xs text-muted-foreground'>{v.latitude ? `${v.latitude.toFixed(4)}, ${v.longitude.toFixed(4)}` : <span className='text-amber-500'>Pending</span>}</TableCell>
                  <TableCell className='text-sm'>₹{v.price_full_day?.toLocaleString()}</TableCell>
                  <TableCell><div className='flex justify-end gap-1'>
                    <Button variant='ghost' size='icon' onClick={() => openEdit(v)}><Pencil className='h-4 w-4'/></Button>
                    <Button variant='ghost' size='icon' onClick={() => openBlockDates(v)}><CalendarOff className='h-4 w-4'/></Button>
                  </div></TableCell>
                </TableRow>
              ))}
              {!isLoading && (venues||[]).length === 0 && <TableRow><TableCell colSpan={7} className='h-24 text-center text-muted-foreground'>No venues yet. Add your first venue!</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent></Card>
      </Main>

      {/* Add/Edit Venue */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className='max-w-2xl max-h-[85vh] overflow-y-auto'>
          <DialogHeader><DialogTitle>{editMode ? 'Edit Venue' : 'Submit New Venue'}</DialogTitle></DialogHeader>
          <div className='grid gap-3 py-2'>
            <div className='grid grid-cols-2 gap-3'>
              <div><Label>Name *</Label><Input value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))}/></div>
              <div><Label>City *</Label><Input value={form.city} onChange={e=>setForm(p=>({...p,city:e.target.value}))}/></div>
            </div>
            <div><Label>Location</Label><Input value={form.location} onChange={e=>setForm(p=>({...p,location:e.target.value}))}/></div>
            <div><Label>Category</Label>
              <Select value={form.category_id} onValueChange={val => setForm(p => ({ ...p, category_id: val }))}>
                <SelectTrigger><SelectValue placeholder='Select category' /></SelectTrigger>
                <SelectContent>{(categories || []).map((cat: any) => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} rows={3}/></div>
            <div className='grid grid-cols-3 gap-3'>
              <div><Label>Morning Session (₹)</Label><Input type='number' value={form.price_morning} onChange={e=>setForm(p=>({...p,price_morning:Number(e.target.value)}))} placeholder='8AM-4PM'/></div>
              <div><Label>Evening Session (₹)</Label><Input type='number' value={form.price_evening} onChange={e=>setForm(p=>({...p,price_evening:Number(e.target.value)}))} placeholder='5PM-12AM'/></div>
              <div><Label>Full Day (₹)</Label><Input type='number' value={form.price_full_day} onChange={e=>setForm(p=>({...p,price_full_day:Number(e.target.value)}))} placeholder='8AM-12AM'/></div>
            </div>
            <div className='grid grid-cols-3 gap-3'>
              <div><Label>Capacity</Label><Input type='number' value={form.capacity} onChange={e=>setForm(p=>({...p,capacity:Number(e.target.value)}))}/></div>
            </div>
            <div><Label>Cover Image URL</Label><Input value={form.image_url} onChange={e=>setForm(p=>({...p,image_url:e.target.value}))} placeholder='https://...'/></div>
            <div><Label>Venue Images (up to 6)</Label>
              <ImageUploader images={form.images} onChange={(imgs) => setForm(p => ({ ...p, images: imgs, image_url: imgs[0] || p.image_url }))} maxImages={6} />
            </div>
            <div><Label>YouTube Video URL</Label><Input value={form.youtube_url} onChange={e=>setForm(p=>({...p,youtube_url:e.target.value}))} placeholder='https://youtube.com/watch?v=...'/></div>
            <div><Label>Amenities</Label>
              <div className='flex gap-2'><Input value={amenityInput} onChange={e=>setAmenityInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();if(amenityInput.trim()){setForm(p=>({...p,amenities:[...p.amenities,amenityInput.trim()]}));setAmenityInput('')}}}}/><Button variant='outline' onClick={()=>{if(amenityInput.trim()){setForm(p=>({...p,amenities:[...p.amenities,amenityInput.trim()]}));setAmenityInput('')}}}>Add</Button></div>
              <div className='flex flex-wrap gap-1 mt-2'>{form.amenities.map((a,i)=><Badge key={i} variant='secondary'>{a}<button className='ml-1' onClick={()=>setForm(p=>({...p,amenities:p.amenities.filter((_,idx)=>idx!==i)}))}>&times;</button></Badge>)}</div>
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={()=>setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={!form.name||!form.city}>{editMode ? 'Save Changes' : 'Submit for Review'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Block Dates */}
      <Dialog open={blockDatesDialogOpen} onOpenChange={setBlockDatesDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Block Dates — {selectedVenue?.name}</DialogTitle></DialogHeader>
          <p className='text-sm text-muted-foreground mb-3'>Blocked dates prevent customers from booking on those days.</p>
          <div className='flex gap-2 mb-4'>
            <Input type='date' value={blockDateInput} onChange={e=>setBlockDateInput(e.target.value)}/>
            <Button onClick={addBlockedDate}>Block</Button>
          </div>
          <div className='flex flex-wrap gap-2'>
            {(selectedVenue?.blocked_dates||[]).map((d: string) => (
              <Badge key={d} variant='secondary' className='gap-1'>{d}<button onClick={()=>removeBlockedDate(d)}>&times;</button></Badge>
            ))}
            {(selectedVenue?.blocked_dates||[]).length === 0 && <p className='text-sm text-muted-foreground'>No dates blocked</p>}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
