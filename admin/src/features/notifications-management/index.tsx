import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Bell,
  Plus,
  Trash2,
  Send,
  Megaphone,
  Search as SearchIcon,
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
import {
  fetchNotifications,
  fetchUsers,
  createNotification,
  broadcastNotification,
  deleteNotification,
} from '@/lib/api'

const NOTIFICATION_TYPES = [
  { value: 'booking', label: 'Booking' },
  { value: 'reminder', label: 'Reminder' },
  { value: 'promotion', label: 'Promotion' },
  { value: 'announcement', label: 'Announcement' },
  { value: 'system', label: 'System' },
]

export function NotificationsPage() {
  const queryClient = useQueryClient()
  const [sendDialogOpen, setSendDialogOpen] = useState(false)
  const [broadcastDialogOpen, setBroadcastDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedNotification, setSelectedNotification] = useState<any>(null)
  const [form, setForm] = useState({
    user_id: '',
    title: '',
    body: '',
    type: 'announcement',
  })
  const [broadcastForm, setBroadcastForm] = useState({
    title: '',
    body: '',
    type: 'announcement',
  })

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['admin-notifications'],
    queryFn: () => fetchNotifications(),
    refetchInterval: 5000, // Sync lively every 5 seconds
  })

  const { data: users } = useQuery({
    queryKey: ['admin-users-list'],
    queryFn: () => fetchUsers(),
  })

  const sendMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => createNotification(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] })
      setSendDialogOpen(false)
      setForm({ user_id: '', title: '', body: '', type: 'announcement' })
      toast.success('Notification sent!')
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to send'),
  })

  const broadcastMutation = useMutation({
    mutationFn: (data: { title: string; body: string; type?: string }) =>
      broadcastNotification(data),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] })
      setBroadcastDialogOpen(false)
      setBroadcastForm({ title: '', body: '', type: 'announcement' })
      toast.success(`Broadcast sent to ${data.count} users!`)
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to broadcast'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] })
      setDeleteDialogOpen(false)
      setSelectedNotification(null)
      toast.success('Notification deleted!')
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to delete'),
  })

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays < 7) return `${diffDays}d ago`
    return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
  }

  const typeColor = (type: string) => {
    switch (type) {
      case 'booking': return 'default' as const
      case 'reminder': return 'secondary' as const
      case 'promotion': return 'outline' as const
      case 'system': return 'destructive' as const
      default: return 'outline' as const
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
            <h2 className='text-2xl font-bold tracking-tight'>Notifications</h2>
            <p className='text-muted-foreground'>
              Send and manage user notifications
            </p>
          </div>
          <div className='flex gap-2'>
            <Button
              variant='outline'
              onClick={() => setBroadcastDialogOpen(true)}
            >
              <Megaphone className='mr-2 h-4 w-4' />
              Broadcast
            </Button>
            <Button onClick={() => setSendDialogOpen(true)}>
              <Send className='mr-2 h-4 w-4' />
              Send Notification
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className='p-0'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='w-8'></TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className='text-center'>Read</TableHead>
                  <TableHead>Sent</TableHead>
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
                  : (notifications || []).map((notif: any) => (
                      <TableRow key={notif.id} className={notif.is_read ? 'opacity-60' : ''}>
                        <TableCell>
                          <div
                            className={`h-2 w-2 rounded-full ${
                              notif.is_read ? 'bg-muted-foreground/30' : 'bg-primary'
                            }`}
                          />
                        </TableCell>
                        <TableCell>
                          <div className='flex items-center gap-2'>
                            <Avatar className='h-7 w-7'>
                              <AvatarFallback className='text-xs'>
                                {(notif.user?.full_name || 'U')[0].toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className='text-sm'>
                              {notif.user?.full_name || notif.user?.email || '—'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className='text-sm font-medium max-w-[200px] truncate'>
                            {notif.title}
                          </p>
                        </TableCell>
                        <TableCell>
                          <p className='text-sm text-muted-foreground max-w-[200px] truncate'>
                            {notif.body || '—'}
                          </p>
                        </TableCell>
                        <TableCell>
                          <Badge variant={typeColor(notif.type)}>{notif.type}</Badge>
                        </TableCell>
                        <TableCell className='text-center'>
                          {notif.is_read ? (
                            <Badge variant='outline' className='text-xs'>Read</Badge>
                          ) : (
                            <Badge className='text-xs'>Unread</Badge>
                          )}
                        </TableCell>
                        <TableCell className='text-sm text-muted-foreground'>
                          {formatTime(notif.created_at)}
                        </TableCell>
                        <TableCell>
                          <div className='flex justify-end'>
                            <Button
                              variant='ghost'
                              size='icon'
                              className='text-destructive'
                              onClick={() => {
                                setSelectedNotification(notif)
                                setDeleteDialogOpen(true)
                              }}
                            >
                              <Trash2 className='h-4 w-4' />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                {!isLoading && (notifications || []).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className='h-24 text-center text-muted-foreground'>
                      No notifications sent yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </Main>

      {/* Send Notification Dialog */}
      <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Notification</DialogTitle>
            <DialogDescription>Send a notification to a specific user</DialogDescription>
          </DialogHeader>
          <div className='grid gap-4 py-4'>
            <div className='space-y-2'>
              <Label>Recipient *</Label>
              <Select
                value={form.user_id}
                onValueChange={(val) => setForm((p) => ({ ...p, user_id: val }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Select user' />
                </SelectTrigger>
                <SelectContent>
                  {(users || []).map((user: any) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.full_name || user.email || user.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-2'>
              <Label>Title *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                placeholder='Booking Confirmed!'
              />
            </div>
            <div className='space-y-2'>
              <Label>Message</Label>
              <Textarea
                value={form.body}
                onChange={(e) => setForm((p) => ({ ...p, body: e.target.value }))}
                placeholder='Your booking has been confirmed...'
                rows={3}
              />
            </div>
            <div className='space-y-2'>
              <Label>Type</Label>
              <Select
                value={form.type}
                onValueChange={(val) => setForm((p) => ({ ...p, type: val }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {NOTIFICATION_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setSendDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                sendMutation.mutate({
                  user_id: form.user_id,
                  title: form.title,
                  body: form.body,
                  type: form.type,
                  is_read: false,
                  data: {},
                })
              }
              disabled={!form.user_id || !form.title || sendMutation.isPending}
            >
              {sendMutation.isPending ? 'Sending...' : 'Send'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Broadcast Dialog */}
      <Dialog open={broadcastDialogOpen} onOpenChange={setBroadcastDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Broadcast Notification</DialogTitle>
            <DialogDescription>
              Send a notification to ALL registered users
            </DialogDescription>
          </DialogHeader>
          <div className='grid gap-4 py-4'>
            <div className='space-y-2'>
              <Label>Title *</Label>
              <Input
                value={broadcastForm.title}
                onChange={(e) =>
                  setBroadcastForm((p) => ({ ...p, title: e.target.value }))
                }
                placeholder='🎉 Special Announcement!'
              />
            </div>
            <div className='space-y-2'>
              <Label>Message *</Label>
              <Textarea
                value={broadcastForm.body}
                onChange={(e) =>
                  setBroadcastForm((p) => ({ ...p, body: e.target.value }))
                }
                placeholder='We have exciting news...'
                rows={4}
              />
            </div>
            <div className='space-y-2'>
              <Label>Type</Label>
              <Select
                value={broadcastForm.type}
                onValueChange={(val) =>
                  setBroadcastForm((p) => ({ ...p, type: val }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {NOTIFICATION_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setBroadcastDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => broadcastMutation.mutate(broadcastForm)}
              disabled={
                !broadcastForm.title ||
                !broadcastForm.body ||
                broadcastMutation.isPending
              }
            >
              <Megaphone className='mr-2 h-4 w-4' />
              {broadcastMutation.isPending ? 'Broadcasting...' : 'Broadcast to All'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Notification</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this notification?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant='outline' onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant='destructive'
              onClick={() =>
                selectedNotification && deleteMutation.mutate(selectedNotification.id)
              }
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
