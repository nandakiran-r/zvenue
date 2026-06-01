import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus,
  Pencil,
  Trash2,
  GripVertical,
} from 'lucide-react'
import { icons } from 'lucide-react'
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
import { Label } from '@/components/ui/label'
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
import { IconPicker } from '@/components/icon-picker'
import {
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '@/lib/api'

export function CategoriesPage() {
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<any>(null)
  const [form, setForm] = useState({ name: '', icon: 'party-popper', sort_order: 0 })

  const { data: categories, isLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: fetchCategories,
  })

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] })
      setDialogOpen(false)
      setForm({ name: '', icon: 'party-popper', sort_order: 0 })
      toast.success('Category created successfully!')
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to create category'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] })
      setDialogOpen(false)
      setEditMode(false)
      toast.success('Category updated successfully!')
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to update category'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] })
      setDeleteDialogOpen(false)
      setSelectedCategory(null)
      toast.success('Category deleted successfully!')
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to delete category'),
  })

  const handleSubmit = () => {
    const payload = {
      name: form.name,
      icon: form.icon,
      sort_order: Number(form.sort_order),
    }
    if (editMode && selectedCategory) {
      updateMutation.mutate({ id: selectedCategory.id, data: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const openEdit = (cat: any) => {
    setSelectedCategory(cat)
    setEditMode(true)
    setForm({
      name: cat.name,
      icon: cat.icon,
      sort_order: cat.sort_order,
    })
    setDialogOpen(true)
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
            <h2 className='text-2xl font-bold tracking-tight'>Categories</h2>
            <p className='text-muted-foreground'>
              Manage venue categories displayed in the app
            </p>
          </div>
          <Button
            onClick={() => {
              setEditMode(false)
              setSelectedCategory(null)
              setForm({ name: '', icon: 'party-popper', sort_order: (categories || []).length })
              setDialogOpen(true)
            }}
          >
            <Plus className='mr-2 h-4 w-4' />
            Add Category
          </Button>
        </div>

        <Card>
          <CardContent className='p-0'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='w-12'>#</TableHead>
                  <TableHead>Icon</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className='text-center'>Sort Order</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className='text-right'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading
                  ? Array.from({ length: 4 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 6 }).map((_, j) => (
                          <TableCell key={j}><Skeleton className='h-4 w-20' /></TableCell>
                        ))}
                      </TableRow>
                    ))
                  : (categories || []).map((cat: any, index: number) => (
                      <TableRow key={cat.id}>
                        <TableCell className='text-muted-foreground'>
                          <div className='flex items-center gap-1'>
                            <GripVertical className='h-4 w-4 text-muted-foreground/50' />
                            {index + 1}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary'>
                            {(() => { const Icon = icons[cat.icon as keyof typeof icons]; return Icon ? <Icon size={18} /> : <span className='text-xs'>{cat.icon}</span> })()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className='font-medium'>{cat.name}</p>
                        </TableCell>
                        <TableCell className='text-center'>
                          <Badge variant='outline'>{cat.sort_order}</Badge>
                        </TableCell>
                        <TableCell className='text-sm text-muted-foreground'>
                          {cat.created_at ? new Date(cat.created_at).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          }) : '—'}
                        </TableCell>
                        <TableCell>
                          <div className='flex items-center justify-end gap-1'>
                            <Button variant='ghost' size='icon' onClick={() => openEdit(cat)}>
                              <Pencil className='h-4 w-4' />
                            </Button>
                            <Button
                              variant='ghost'
                              size='icon'
                              className='text-destructive'
                              onClick={() => {
                                setSelectedCategory(cat)
                                setDeleteDialogOpen(true)
                              }}
                            >
                              <Trash2 className='h-4 w-4' />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </Main>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editMode ? 'Edit Category' : 'Add Category'}</DialogTitle>
            <DialogDescription>
              Categories are displayed in the app's home and search screens.
            </DialogDescription>
          </DialogHeader>

          <div className='grid gap-4 py-4'>
            <div className='space-y-2'>
              <Label>Category Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder='Wedding Halls'
              />
            </div>
            <IconPicker value={form.icon} onChange={icon => setForm(p => ({ ...p, icon }))} label='Icon' />
            <div className='space-y-2'>
              <Label>Sort Order</Label>
              <Input
                type='number'
                value={form.sort_order}
                onChange={(e) => setForm((p) => ({ ...p, sort_order: Number(e.target.value) }))}
              />
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
                  ? 'Update'
                  : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedCategory?.name}"? Venues in this category
              will lose their category association.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant='outline' onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant='destructive'
              onClick={() => selectedCategory && deleteMutation.mutate(selectedCategory.id)}
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
