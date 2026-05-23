import { useQuery } from '@tanstack/react-query'
import { CalendarCheck, MapPin, Clock, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

function getSessionLabel(startTime: string, endTime: string) {
  if (startTime === '08:00 AM' && endTime === '12:00 PM') return 'Morning'
  if (startTime === '01:00 PM' && endTime === '05:00 PM') return 'Afternoon'
  if (startTime === '08:00 AM' && endTime === '05:00 PM') return 'Full Day'
  return `${startTime || ''} - ${endTime || ''}`
}
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { fetchOwnerBookings } from '@/lib/api'

export function OwnerBookingsPage() {
  const { data: bookings, isLoading } = useQuery({ queryKey: ['owner-bookings'], queryFn: fetchOwnerBookings, refetchInterval: 10000 })

  return (
    <>
      <Header fixed><ThemeSwitch /><ProfileDropdown /></Header>
      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div><h2 className='text-2xl font-bold'>Venue Bookings</h2><p className='text-muted-foreground'>Customers who booked your venues</p></div>
        <Card><CardContent className='p-0'>
          <Table>
            <TableHeader><TableRow>
              <TableHead>Customer</TableHead><TableHead>Venue</TableHead><TableHead>Date</TableHead><TableHead>Time</TableHead><TableHead className='text-center'>Guests</TableHead><TableHead className='text-right'>Total</TableHead><TableHead className='text-center'>Status</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {isLoading ? Array.from({length:4}).map((_,i)=><TableRow key={i}>{Array.from({length:7}).map((_,j)=><TableCell key={j}><Skeleton className='h-4 w-20'/></TableCell>)}</TableRow>) :
              (bookings||[]).map((b: any) => (
                <TableRow key={b.id}>
                  <TableCell><div className='flex items-center gap-2'><Avatar className='h-8 w-8'><AvatarImage src={b.user?.avatar_url}/><AvatarFallback>{(b.user?.full_name||'U')[0]}</AvatarFallback></Avatar><div><p className='text-sm font-medium'>{b.user?.full_name||'Unknown'}</p><p className='text-xs text-muted-foreground'>{b.user?.email}</p></div></div></TableCell>
                  <TableCell><p className='text-sm font-medium'>{b.venue?.name}</p><p className='text-xs text-muted-foreground flex items-center gap-1'><MapPin className='h-3 w-3'/>{b.venue?.city}</p></TableCell>
                  <TableCell><div className='flex items-center gap-1 text-sm'><CalendarCheck className='h-3 w-3 text-muted-foreground'/>{b.booking_date}</div></TableCell>
                  <TableCell><div className='flex items-center gap-1 text-sm'><Clock className='h-3 w-3 text-muted-foreground'/>{getSessionLabel(b.start_time, b.end_time)}</div></TableCell>
                  <TableCell className='text-center'><div className='flex items-center justify-center gap-1'><Users className='h-3 w-3 text-muted-foreground'/>{b.guests}</div></TableCell>
                  <TableCell className='text-right font-medium'>₹{(b.total||0).toLocaleString('en-IN')}</TableCell>
                  <TableCell className='text-center'><Badge variant={b.status==='confirmed'?'default':b.status==='pending'?'secondary':'destructive'}>{b.status}</Badge></TableCell>
                </TableRow>
              ))}
              {!isLoading && (bookings||[]).length===0 && <TableRow><TableCell colSpan={7} className='h-24 text-center text-muted-foreground'>No bookings yet</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent></Card>
      </Main>
    </>
  )
}
