import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { icons } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ConfigDrawer } from '@/components/config-drawer'
import { IconPicker } from '@/components/icon-picker'
import { fetchAdminServiceCategories, createServiceCategory, updateServiceCategory, deleteServiceCategory } from '@/lib/api'

export function ServiceCategoriesPage() {
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', icon: 'star', sort_order: 0 })

  const { data: categories, isLoading } = useQuery({ queryKey: ['service-categories'], queryFn: fetchAdminServiceCategories })

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => createServiceCategory(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['service-categories'] }); setDialogOpen(false); toast.success('Category created') },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed'),
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => updateServiceCategory(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['service-categories'] }); setDialogOpen(false); toast.success('Category updated') },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed'),
  })
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteServiceCategory(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['service-categories'] }); toast.success('Category deleted') },
  })

  const handleSubmit = () => {
    if (editMode && selectedId) updateMutation.mutate({ id: selectedId, data: form })
    else createMutation.mutate(form)
  }

  const openEdit = (cat: any) => {
    setSelectedId(cat.id); setEditMode(true)
    setForm({ name: cat.name, icon: cat.icon || 'star', sort_order: cat.sort_order || 0 })
    setDialogOpen(true)
  }

  const toggleActive = (cat: any) => {
    updateMutation.mutate({ id: cat.id, data: { is_active: !cat.is_active } })
  }

  return (
    <>
      <Header fixed><Search className='me-auto' /><ThemeSwitch /><ConfigDrawer /><ProfileDropdown /></Header>
      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div className='flex items-end justify-between'>
          <div>
            <h2 className='text-2xl font-bold'>Service Categories</h2>
            <p className='text-muted-foreground'>Manage service marketplace categories</p>
          </div>
          <Button onClick={() => { setEditMode(false); setSelectedId(null); setForm({ name: '', icon: 'star', sort_order: 0 }); setDialogOpen(true) }}>
            <Plus className='mr-2 h-4 w-4' />Add Category
          </Button>
        </div>

        <Card><CardContent className='p-0'>
          <Table>
            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Icon</TableHead><TableHead>Order</TableHead><TableHead>Listings</TableHead><TableHead>Active</TableHead><TableHead className='text-right'>Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {isLoading ? Array.from({ length: 5 }).map((_, i) => <TableRow key={i}>{Array.from({ length: 6 }).map((_, j) => <TableCell key={j}><Skeleton className='h-4 w-16' /></TableCell>)}</TableRow>) :
              (categories || []).map((cat: any) => (
                <TableRow key={cat.id}>
                  <TableCell className='font-medium'>{cat.name}</TableCell>
                  <TableCell>
                    <div className='flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary'>
                      {(() => { const Icon = icons[cat.icon as keyof typeof icons]; return Icon ? <Icon size={16} /> : <span className='text-xs'>{cat.icon}</span> })()}
                    </div>
                  </TableCell>
                  <TableCell>{cat.sort_order}</TableCell>
                  <TableCell>{cat.listing_count || 0}</TableCell>
                  <TableCell><Switch checked={cat.is_active} onCheckedChange={() => toggleActive(cat)} /></TableCell>
                  <TableCell className='text-right'>
                    <div className='flex justify-end gap-1'>
                      <Button variant='ghost' size='icon' onClick={() => openEdit(cat)}><Pencil className='h-4 w-4' /></Button>
                      <Button variant='ghost' size='icon' className='text-destructive' onClick={() => deleteMutation.mutate(cat.id)}><Trash2 className='h-4 w-4' /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent></Card>
      </Main>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editMode ? 'Edit Category' : 'New Service Category'}</DialogTitle></DialogHeader>
          <div className='grid gap-4 py-4'>
            <div><Label>Name</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder='e.g. Saloons' /></div>
            <IconPicker value={form.icon} onChange={icon => setForm(p => ({ ...p, icon }))} label='Icon' />
            <div><Label>Sort Order</Label><Input type='number' value={form.sort_order} onChange={e => setForm(p => ({ ...p, sort_order: Number(e.target.value) }))} /></div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={!form.name}>{editMode ? 'Save' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
