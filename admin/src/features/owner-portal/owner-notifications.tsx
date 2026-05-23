import { useQuery } from '@tanstack/react-query'
import { Bell, CheckCircle2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { useAuth } from '@/context/auth-provider'
import { fetchNotifications } from '@/lib/api'

export function OwnerNotificationsPage() {
  const { user } = useAuth()
  
  const { data: notifications, isLoading } = useQuery({
    queryKey: ['owner-notifications', user?.id],
    queryFn: () => fetchNotifications({ owner_id: user?.id } as any),
    refetchInterval: 15000,
    enabled: !!user?.id,
  })

  // Notifications already filtered by backend for this owner
  const ownerNotifs = notifications || []

  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''

  return (
    <>
      <Header fixed><ThemeSwitch /><ProfileDropdown /></Header>
      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div>
          <h2 className='text-2xl font-bold'>Notifications</h2>
          <p className='text-muted-foreground'>Updates from the admin team</p>
        </div>

        <div className='space-y-3'>
          {isLoading ? Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className='p-4'><Skeleton className='h-12 w-full' /></CardContent></Card>
          )) : ownerNotifs.length > 0 ? ownerNotifs.map((notif: any) => (
            <Card key={notif.id} className={notif.is_read ? 'opacity-70' : ''}>
              <CardContent className='p-4 flex items-start gap-3'>
                <div className={`mt-1 rounded-full p-2 ${notif.type === 'venue_rejected' ? 'bg-red-100' : 'bg-emerald-100'}`}>
                  {notif.type === 'venue_rejected' ? (
                    <Bell className='h-4 w-4 text-red-600' />
                  ) : (
                    <CheckCircle2 className='h-4 w-4 text-emerald-600' />
                  )}
                </div>
                <div className='flex-1'>
                  <div className='flex items-center justify-between'>
                    <p className='font-medium text-sm'>{notif.title}</p>
                    <span className='text-xs text-muted-foreground'>{formatDate(notif.created_at)}</span>
                  </div>
                  <p className='text-sm text-muted-foreground mt-1'>{notif.body}</p>
                  <Badge variant='outline' className='mt-2 text-[10px]'>{notif.type}</Badge>
                </div>
              </CardContent>
            </Card>
          )) : (
            <Card><CardContent className='p-8 text-center text-muted-foreground'>
              <Bell className='h-8 w-8 mx-auto mb-2 opacity-40' />
              <p>No notifications yet</p>
            </CardContent></Card>
          )}
        </div>
      </Main>
    </>
  )
}
