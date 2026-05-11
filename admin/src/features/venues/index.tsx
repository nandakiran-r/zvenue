import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Building2,
  Plus,
  Search as SearchIcon,
  MapPin,
  Star,
  Users,
  IndianRupee,
  Pencil,
  Trash2,
  Eye,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
} from '@/lib/api'

function formatINR(amount: number) {
  return `₹${(amount || 0).toLocaleString('en-IN')}`
}

const defaultVenueForm = {
  name: '',
  description: '',
  location: '',
  city: '',
  category_id: '',
  image_url: '',
  price_per_hour: 0,
  price_per_day: 0,
  capacity: 0,
  rating: 0,
  review_count: 0,
  area: '',
  amenities: [] as string[],
  owner_name: '',
  owner_image: '',
  available_dates: [] as string[],
}

export function VenuesPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [selectedVenue, setSelectedVenue] = useState<any>(null)
  const [form, setForm] = useState(defaultVenueForm)
  const [amenityInput, setAmenityInput] = useState('')

  const { data: venues, isLoading } = useQuery({
    queryKey: ['admin-venues', search, categoryFilter],
    queryFn: () =>
      fetchVenues({
        search: search || undefined,
        category_id: categoryFilter !== 'all' ? categoryFilter : undefined,
      }),
  })

  const { data: categories } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: fetchCategories,
  })

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => createVenue(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-venues'] })
      setDialogOpen(false)
      setForm(defaultVenueForm)
      toast.success('Venue created successfully!')
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to create venue'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      updateVenue(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-venues'] })
      setDialogOpen(false)
      setForm(defaultVenueForm)
      setEditMode(false)
      toast.success('Venue updated successfully!')
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to update venue'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteVenue(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-venues'] })
      setDeleteDialogOpen(false)
      setSelectedVenue(null)
      toast.success('Venue deleted successfully!')
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to delete venue'),
  })

  const handleSubmit = () => {
    const payload = {
      ...form,
      price_per_hour: Number(form.price_per_hour),
      price_per_day: Number(form.price_per_day),
      capacity: Number(form.capacity),
      rating: Number(form.rating),
      review_count: Number(form.review_count),
      category_id: form.category_id || null,
    }
    if (editMode && selectedVenue) {
      updateMutation.mutate({ id: selectedVenue.id, data: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const openEdit = (venue: any) => {
    setSelectedVenue(venue)
    setEditMode(true)
    setForm({
      name: venue.name || '',
      description: venue.description || '',
      location: venue.location || '',
      city: venue.city || '',
      category_id: venue.category_id || '',
      image_url: venue.image_url || '',
      price_per_hour: venue.price_per_hour || 0,
      price_per_day: venue.price_per_day || 0,
      capacity: venue.capacity || 0,
      rating: venue.rating || 0,
      review_count: venue.review_count || 0,
      area: venue.area || '',
      amenities: venue.amenities || [],
      owner_name: venue.owner_name || '',
      owner_image: venue.owner_image || '',
      available_dates: venue.available_dates || [],
    })
    setDialogOpen(true)
  }

  const addAmenity = () => {
    if (amenityInput.trim() && !form.amenities.includes(amenityInput.trim())) {
      setForm((prev) => ({ ...prev, amenities: [...prev.amenities, amenityInput.trim()] }))
      setAmenityInput('')
    }
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
            <h2 className='text-2xl font-bold tracking-tight'>Venues</h2>
            <p className='text-muted-foreground'>
              Manage all venues on the platform
            </p>
          </div>
          <Button
            onClick={() => {
              setEditMode(false)
              setSelectedVenue(null)
              setForm(defaultVenueForm)
              setDialogOpen(true)
            }}
          >
            <Plus className='mr-2 h-4 w-4' />
            Add Venue
          </Button>
        </div>

        {/* Filters */}
        <div className='flex flex-wrap gap-3'>
          <div className='relative flex-1 min-w-[200px] max-w-sm'>
            <SearchIcon className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
            <Input
              placeholder='Search venues...'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className='pl-9'
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className='w-[180px]'>
              <SelectValue placeholder='All Categories' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Categories</SelectItem>
              {(categories || []).map((cat: any) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Venues Table */}
        <Card>
          <CardContent className='p-0'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='w-12'></TableHead>
                  <TableHead>Venue</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className='text-right'>Price/hr</TableHead>
                  <TableHead className='text-right'>Price/day</TableHead>
                  <TableHead className='text-center'>Capacity</TableHead>
                  <TableHead className='text-center'>Rating</TableHead>
                  <TableHead className='text-right'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className='h-10 w-10 rounded-lg' /></TableCell>
                        <TableCell><Skeleton className='h-4 w-32' /></TableCell>
                        <TableCell><Skeleton className='h-4 w-20' /></TableCell>
                        <TableCell><Skeleton className='h-4 w-20' /></TableCell>
                        <TableCell><Skeleton className='h-4 w-16' /></TableCell>
                        <TableCell><Skeleton className='h-4 w-16' /></TableCell>
                        <TableCell><Skeleton className='h-4 w-10' /></TableCell>
                        <TableCell><Skeleton className='h-4 w-10' /></TableCell>
                        <TableCell><Skeleton className='h-4 w-20' /></TableCell>
                      </TableRow>
                    ))
                  : (venues || []).map((venue: any) => (
                      <TableRow key={venue.id}>
                        <TableCell>
                          <Avatar className='h-10 w-10 rounded-lg'>
                            <AvatarImage src={venue.image_url} className='object-cover' />
                            <AvatarFallback className='rounded-lg'>
                              <Building2 className='h-4 w-4' />
                            </AvatarFallback>
                          </Avatar>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className='font-medium'>{venue.name}</p>
                            <p className='text-xs text-muted-foreground truncate max-w-[200px]'>
                              {venue.location}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className='flex items-center gap-1'>
                            <MapPin className='h-3 w-3 text-muted-foreground' />
                            <span className='text-sm'>{venue.city || '—'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant='secondary'>
                            {venue.category?.name || '—'}
                          </Badge>
                        </TableCell>
                        <TableCell className='text-right font-medium'>
                          {formatINR(venue.price_per_hour)}
                        </TableCell>
                        <TableCell className='text-right font-medium'>
                          {formatINR(venue.price_per_day)}
                        </TableCell>
                        <TableCell className='text-center'>
                          <div className='flex items-center justify-center gap-1'>
                            <Users className='h-3 w-3 text-muted-foreground' />
                            {venue.capacity}
                          </div>
                        </TableCell>
                        <TableCell className='text-center'>
                          <div className='flex items-center justify-center gap-1'>
                            <Star className='h-3 w-3 text-amber-500' />
                            <span className='font-medium'>{venue.rating}</span>
                            <span className='text-xs text-muted-foreground'>
                              ({venue.review_count})
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className='flex items-center justify-end gap-1'>
                            <Button
                              variant='ghost'
                              size='icon'
                              onClick={() => {
                                setSelectedVenue(venue)
                                setDetailDialogOpen(true)
                              }}
                            >
                              <Eye className='h-4 w-4' />
                            </Button>
                            <Button
                              variant='ghost'
                              size='icon'
                              onClick={() => openEdit(venue)}
                            >
                              <Pencil className='h-4 w-4' />
                            </Button>
                            <Button
                              variant='ghost'
                              size='icon'
                              className='text-destructive'
                              onClick={() => {
                                setSelectedVenue(venue)
                                setDeleteDialogOpen(true)
                              }}
                            >
                              <Trash2 className='h-4 w-4' />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                {!isLoading && (venues || []).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className='h-24 text-center text-muted-foreground'>
                      No venues found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </Main>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className='max-w-2xl max-h-[85vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>{editMode ? 'Edit Venue' : 'Add New Venue'}</DialogTitle>
            <DialogDescription>
              {editMode ? 'Update venue details' : 'Fill in the details to create a new venue'}
            </DialogDescription>
          </DialogHeader>

          <div className='grid gap-4 py-4'>
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label>Venue Name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder='Grand Celebration Hall'
                />
              </div>
              <div className='space-y-2'>
                <Label>City</Label>
                <Input
                  value={form.city}
                  onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                  placeholder='Ahmedabad'
                />
              </div>
            </div>

            <div className='space-y-2'>
              <Label>Location / Address</Label>
              <Input
                value={form.location}
                onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
                placeholder='123 Main Street, Navrangpura'
              />
            </div>

            <div className='space-y-2'>
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder='A beautiful venue...'
                rows={3}
              />
            </div>

            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label>Category</Label>
                <Select
                  value={form.category_id}
                  onValueChange={(val) => setForm((p) => ({ ...p, category_id: val }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select category' />
                  </SelectTrigger>
                  <SelectContent>
                    {(categories || []).map((cat: any) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className='space-y-2'>
                <Label>Image URL</Label>
                <Input
                  value={form.image_url}
                  onChange={(e) => setForm((p) => ({ ...p, image_url: e.target.value }))}
                  placeholder='https://...'
                />
              </div>
            </div>

            <div className='grid grid-cols-3 gap-4'>
              <div className='space-y-2'>
                <Label>Price/Hour (₹)</Label>
                <Input
                  type='number'
                  value={form.price_per_hour}
                  onChange={(e) => setForm((p) => ({ ...p, price_per_hour: Number(e.target.value) }))}
                />
              </div>
              <div className='space-y-2'>
                <Label>Price/Day (₹)</Label>
                <Input
                  type='number'
                  value={form.price_per_day}
                  onChange={(e) => setForm((p) => ({ ...p, price_per_day: Number(e.target.value) }))}
                />
              </div>
              <div className='space-y-2'>
                <Label>Capacity</Label>
                <Input
                  type='number'
                  value={form.capacity}
                  onChange={(e) => setForm((p) => ({ ...p, capacity: Number(e.target.value) }))}
                />
              </div>
            </div>

            <div className='grid grid-cols-3 gap-4'>
              <div className='space-y-2'>
                <Label>Area</Label>
                <Input
                  value={form.area}
                  onChange={(e) => setForm((p) => ({ ...p, area: e.target.value }))}
                  placeholder='5000 sq ft'
                />
              </div>
              <div className='space-y-2'>
                <Label>Owner Name</Label>
                <Input
                  value={form.owner_name}
                  onChange={(e) => setForm((p) => ({ ...p, owner_name: e.target.value }))}
                />
              </div>
              <div className='space-y-2'>
                <Label>Owner Image URL</Label>
                <Input
                  value={form.owner_image}
                  onChange={(e) => setForm((p) => ({ ...p, owner_image: e.target.value }))}
                />
              </div>
            </div>

            <div className='space-y-2'>
              <Label>Amenities</Label>
              <div className='flex gap-2'>
                <Input
                  value={amenityInput}
                  onChange={(e) => setAmenityInput(e.target.value)}
                  placeholder='Wi-Fi, AC, Parking...'
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAmenity())}
                />
                <Button type='button' variant='outline' onClick={addAmenity}>
                  Add
                </Button>
              </div>
              <div className='flex flex-wrap gap-2 mt-2'>
                {form.amenities.map((a, i) => (
                  <Badge key={i} variant='secondary' className='gap-1'>
                    {a}
                    <button
                      onClick={() =>
                        setForm((p) => ({
                          ...p,
                          amenities: p.amenities.filter((_, idx) => idx !== i),
                        }))
                      }
                    >
                      <X className='h-3 w-3' />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant='outline' onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!form.name || createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending
                ? 'Saving...'
                : editMode
                  ? 'Update Venue'
                  : 'Create Venue'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className='max-w-lg'>
          <DialogHeader>
            <DialogTitle>Venue Details</DialogTitle>
          </DialogHeader>
          {selectedVenue && (
            <div className='space-y-4'>
              {selectedVenue.image_url && (
                <img
                  src={selectedVenue.image_url}
                  alt={selectedVenue.name}
                  className='w-full h-48 object-cover rounded-lg'
                />
              )}
              <div>
                <h3 className='text-lg font-bold'>{selectedVenue.name}</h3>
                <p className='text-sm text-muted-foreground'>
                  {selectedVenue.location} · {selectedVenue.city}
                </p>
              </div>
              <p className='text-sm'>{selectedVenue.description}</p>
              <div className='grid grid-cols-3 gap-4 text-center'>
                <div className='rounded-lg bg-muted p-3'>
                  <p className='text-xs text-muted-foreground'>Price/hr</p>
                  <p className='font-bold'>{formatINR(selectedVenue.price_per_hour)}</p>
                </div>
                <div className='rounded-lg bg-muted p-3'>
                  <p className='text-xs text-muted-foreground'>Price/day</p>
                  <p className='font-bold'>{formatINR(selectedVenue.price_per_day)}</p>
                </div>
                <div className='rounded-lg bg-muted p-3'>
                  <p className='text-xs text-muted-foreground'>Capacity</p>
                  <p className='font-bold'>{selectedVenue.capacity}</p>
                </div>
              </div>
              <div>
                <p className='text-sm font-medium mb-2'>Amenities</p>
                <div className='flex flex-wrap gap-2'>
                  {(selectedVenue.amenities || []).map((a: string, i: number) => (
                    <Badge key={i} variant='outline'>{a}</Badge>
                  ))}
                </div>
              </div>
              {selectedVenue.owner_name && (
                <div className='flex items-center gap-3'>
                  <Avatar className='h-10 w-10'>
                    <AvatarImage src={selectedVenue.owner_image} />
                    <AvatarFallback>{selectedVenue.owner_name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className='text-xs text-muted-foreground'>Owner</p>
                    <p className='text-sm font-medium'>{selectedVenue.owner_name}</p>
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
            <DialogTitle>Delete Venue</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedVenue?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant='outline' onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant='destructive'
              onClick={() => selectedVenue && deleteMutation.mutate(selectedVenue.id)}
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
