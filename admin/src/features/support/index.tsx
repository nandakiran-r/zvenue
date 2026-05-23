import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { LifeBuoy, MessageSquare, Clock, CheckCircle2, AlertCircle, Send } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { useAuth } from '@/context/auth-provider'
import { fetchSupportTickets, fetchMyTickets, createSupportTicket, replySupportTicket } from '@/lib/api'

function statusBadge(status: string) {
  switch (status) {
    case 'open': return <Badge variant='secondary' className='gap-1'><AlertCircle className='h-3 w-3' />Open</Badge>
    case 'in_progress': return <Badge className='bg-blue-100 text-blue-700 hover:bg-blue-100 gap-1'><Clock className='h-3 w-3' />In Progress</Badge>
    case 'resolved': return <Badge className='bg-emerald-100 text-emerald-700 hover:bg-emerald-100 gap-1'><CheckCircle2 className='h-3 w-3' />Resolved</Badge>
    case 'closed': return <Badge variant='outline'>Closed</Badge>
    default: return <Badge variant='outline'>{status}</Badge>
  }
}

function priorityBadge(priority: string) {
  switch (priority) {
    case 'high': return <Badge variant='destructive' className='text-[10px]'>High</Badge>
    case 'medium': return <Badge variant='secondary' className='text-[10px]'>Medium</Badge>
    case 'low': return <Badge variant='outline' className='text-[10px]'>Low</Badge>
    default: return <Badge variant='outline' className='text-[10px]'>{priority}</Badge>
  }
}

export function SupportPage() {
  const { role } = useAuth()
  const isOwner = role === 'owner'
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('all')
  const [replyDialogOpen, setReplyDialogOpen] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<any>(null)
  const [replyText, setReplyText] = useState('')
  const [replyStatus, setReplyStatus] = useState('in_progress')
  const [newTicket, setNewTicket] = useState({ subject: '', description: '', priority: 'medium' })

  const { data: tickets, isLoading } = useQuery({
    queryKey: ['support-tickets', statusFilter, isOwner],
    queryFn: () => isOwner ? fetchMyTickets() : fetchSupportTickets({ status: statusFilter !== 'all' ? statusFilter : undefined }),
    refetchInterval: 10000,
  })

  const replyMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => replySupportTicket(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] })
      setReplyDialogOpen(false)
      setReplyText('')
      toast.success('Reply sent')
    },
  })

  const createMutation = useMutation({
    mutationFn: (data: any) => createSupportTicket(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] })
      setCreateDialogOpen(false)
      setNewTicket({ subject: '', description: '', priority: 'medium' })
      toast.success('Ticket created! Admin will respond soon.')
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to create ticket'),
  })

  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

  return (
    <>
      <Header fixed><Search className='me-auto' /><ThemeSwitch /><ProfileDropdown /></Header>
      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div className='flex flex-wrap items-end justify-between gap-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>{isOwner ? 'Support' : 'Support Tickets'}</h2>
            <p className='text-muted-foreground'>{isOwner ? 'Get help from the admin team' : 'Manage owner support requests'}</p>
          </div>
          {isOwner && (
            <Button onClick={() => setCreateDialogOpen(true)}><LifeBuoy className='mr-2 h-4 w-4' />New Ticket</Button>
          )}
        </div>

        {!isOwner && (
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className='w-[160px]'><SelectValue placeholder='All' /></SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All</SelectItem>
              <SelectItem value='open'>Open</SelectItem>
              <SelectItem value='in_progress'>In Progress</SelectItem>
              <SelectItem value='resolved'>Resolved</SelectItem>
              <SelectItem value='closed'>Closed</SelectItem>
            </SelectContent>
          </Select>
        )}

        <Card>
          <CardContent className='p-0'>
            <Table>
              <TableHeader>
                <TableRow>
                  {!isOwner && <TableHead>Owner</TableHead>}
                  <TableHead>Subject</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className='text-right'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>{Array.from({ length: isOwner ? 5 : 6 }).map((_, j) => <TableCell key={j}><Skeleton className='h-4 w-20' /></TableCell>)}</TableRow>
                )) : (tickets || []).map((ticket: any) => (
                  <TableRow key={ticket.id}>
                    {!isOwner && <TableCell className='text-sm font-medium'>{ticket.owner?.full_name || '—'}</TableCell>}
                    <TableCell>
                      <p className='text-sm font-medium'>{ticket.subject}</p>
                      <p className='text-xs text-muted-foreground truncate max-w-[200px]'>{ticket.description}</p>
                    </TableCell>
                    <TableCell>{priorityBadge(ticket.priority)}</TableCell>
                    <TableCell>{statusBadge(ticket.status)}</TableCell>
                    <TableCell className='text-sm text-muted-foreground'>{formatDate(ticket.created_at)}</TableCell>
                    <TableCell className='text-right'>
                      <Button variant='ghost' size='sm' onClick={() => { setSelectedTicket(ticket); setReplyDialogOpen(true); setReplyStatus(ticket.status); }}>
                        <MessageSquare className='h-4 w-4 mr-1' />{isOwner ? 'View' : 'Reply'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!isLoading && (tickets || []).length === 0 && (
                  <TableRow><TableCell colSpan={isOwner ? 5 : 6} className='h-24 text-center text-muted-foreground'>No tickets</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </Main>

      {/* Reply/View Dialog */}
      <Dialog open={replyDialogOpen} onOpenChange={setReplyDialogOpen}>
        <DialogContent className='max-w-lg'>
          <DialogHeader><DialogTitle>Ticket: {selectedTicket?.subject}</DialogTitle></DialogHeader>
          {selectedTicket && (
            <div className='space-y-4'>
              <div className='rounded-lg bg-muted p-4'>
                <p className='text-sm'>{selectedTicket.description}</p>
                <p className='text-xs text-muted-foreground mt-2'>— {selectedTicket.owner?.full_name || 'Owner'} · {formatDate(selectedTicket.created_at)}</p>
              </div>
              {selectedTicket.admin_reply && (
                <div className='rounded-lg border-l-4 border-l-primary bg-primary/5 p-4'>
                  <p className='text-sm'>{selectedTicket.admin_reply}</p>
                  <p className='text-xs text-muted-foreground mt-2'>— Admin · {formatDate(selectedTicket.replied_at)}</p>
                </div>
              )}
              {!isOwner && (
                <>
                  <Textarea placeholder='Type your reply...' value={replyText} onChange={e => setReplyText(e.target.value)} rows={3} />
                  <Select value={replyStatus} onValueChange={setReplyStatus}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value='open'>Open</SelectItem>
                      <SelectItem value='in_progress'>In Progress</SelectItem>
                      <SelectItem value='resolved'>Resolved</SelectItem>
                      <SelectItem value='closed'>Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </>
              )}
            </div>
          )}
          <DialogFooter>
            {!isOwner && (
              <Button onClick={() => replyMutation.mutate({ id: selectedTicket.id, data: { admin_reply: replyText, status: replyStatus } })} disabled={replyMutation.isPending}>
                <Send className='h-4 w-4 mr-1' />{replyMutation.isPending ? 'Sending...' : 'Send Reply'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Ticket Dialog (Owner) */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Support Ticket</DialogTitle></DialogHeader>
          <div className='space-y-3'>
            <Input placeholder='Subject' value={newTicket.subject} onChange={e => setNewTicket(t => ({ ...t, subject: e.target.value }))} />
            <Textarea placeholder='Describe your issue...' value={newTicket.description} onChange={e => setNewTicket(t => ({ ...t, description: e.target.value }))} rows={4} />
            <Select value={newTicket.priority} onValueChange={v => setNewTicket(t => ({ ...t, priority: v }))}>
              <SelectTrigger><SelectValue placeholder='Priority' /></SelectTrigger>
              <SelectContent>
                <SelectItem value='low'>Low</SelectItem>
                <SelectItem value='medium'>Medium</SelectItem>
                <SelectItem value='high'>High</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => createMutation.mutate(newTicket)} disabled={createMutation.isPending || !newTicket.subject || !newTicket.description}>
              {createMutation.isPending ? 'Submitting...' : 'Submit Ticket'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
