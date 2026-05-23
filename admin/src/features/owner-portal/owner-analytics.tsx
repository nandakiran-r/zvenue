import { useQuery } from '@tanstack/react-query'
import { Building2, CalendarCheck, IndianRupee, Clock, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { fetchOwnerAnalytics } from '@/lib/api'
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts'

export function OwnerAnalyticsPage() {
  const { data, isLoading } = useQuery({ queryKey: ['owner-analytics'], queryFn: fetchOwnerAnalytics, refetchInterval: 30000 })

  if (isLoading) return (
    <><Header fixed><ThemeSwitch /><ProfileDropdown /></Header>
    <Main className='flex flex-1 flex-col gap-6'><div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>{Array.from({length:4}).map((_,i)=><Card key={i}><CardContent className='p-6'><Skeleton className='h-8 w-24'/></CardContent></Card>)}</div></Main></>
  )

  return (
    <>
      <Header fixed><ThemeSwitch /><ProfileDropdown /></Header>
      <Main className='flex flex-1 flex-col gap-6'>
        <div><h2 className='text-2xl font-bold'>Business Analytics</h2><p className='text-muted-foreground'>Overview of your venue performance</p></div>

        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
          <Card><CardHeader className='flex flex-row items-center justify-between pb-2'><CardTitle className='text-sm font-medium'>Total Revenue</CardTitle><IndianRupee className='h-4 w-4 text-muted-foreground'/></CardHeader><CardContent><div className='text-2xl font-bold'>₹{(data?.total_revenue||0).toLocaleString('en-IN')}</div></CardContent></Card>
          <Card><CardHeader className='flex flex-row items-center justify-between pb-2'><CardTitle className='text-sm font-medium'>Total Bookings</CardTitle><CalendarCheck className='h-4 w-4 text-muted-foreground'/></CardHeader><CardContent><div className='text-2xl font-bold'>{data?.total_bookings||0}</div><p className='text-xs text-muted-foreground'>{data?.confirmed_bookings||0} confirmed · {data?.pending_bookings||0} pending</p></CardContent></Card>
          <Card><CardHeader className='flex flex-row items-center justify-between pb-2'><CardTitle className='text-sm font-medium'>Active Venues</CardTitle><Building2 className='h-4 w-4 text-muted-foreground'/></CardHeader><CardContent><div className='text-2xl font-bold'>{data?.venues_count||0}</div></CardContent></Card>
          <Card><CardHeader className='flex flex-row items-center justify-between pb-2'><CardTitle className='text-sm font-medium'>Avg Revenue</CardTitle><TrendingUp className='h-4 w-4 text-muted-foreground'/></CardHeader><CardContent><div className='text-2xl font-bold'>₹{data?.total_bookings ? Math.round((data?.total_revenue||0)/(data?.total_bookings||1)).toLocaleString('en-IN') : '0'}</div><p className='text-xs text-muted-foreground'>per booking</p></CardContent></Card>
        </div>

        <div className='grid gap-4 lg:grid-cols-2'>
          <Card><CardHeader><CardTitle>Monthly Revenue</CardTitle></CardHeader><CardContent>
            {(data?.monthly_revenue||[]).length > 0 ? (
              <ResponsiveContainer width='100%' height={250}>
                <BarChart data={data.monthly_revenue}><CartesianGrid strokeDasharray='3 3'/><XAxis dataKey='month' tick={{fontSize:12}}/><YAxis tick={{fontSize:12}} tickFormatter={v=>`₹${(v/1000).toFixed(0)}k`}/><Tooltip formatter={(v: number)=>[`₹${v.toLocaleString()}`, 'Revenue']}/><Bar dataKey='revenue' fill='#7a3317' radius={[4,4,0,0]}/></BarChart>
              </ResponsiveContainer>
            ) : <p className='text-sm text-muted-foreground text-center py-8'>No revenue data yet</p>}
          </CardContent></Card>

          <Card><CardHeader><CardTitle>Popular Time Slots</CardTitle></CardHeader><CardContent>
            {(data?.popular_time_slots||[]).length > 0 ? (
              <div className='space-y-3'>
                {data.popular_time_slots.map((slot: any, i: number) => (
                  <div key={i} className='flex items-center gap-3'>
                    <Clock className='h-4 w-4 text-muted-foreground'/>
                    <span className='text-sm font-medium flex-1'>{slot.slot}</span>
                    <div className='flex-1'><div className='h-2 rounded-full bg-muted overflow-hidden'><div className='h-full rounded-full bg-primary' style={{width:`${(slot.count/Math.max(...data.popular_time_slots.map((s:any)=>s.count)))*100}%`}}/></div></div>
                    <span className='text-sm text-muted-foreground w-12 text-right'>{slot.count} bookings</span>
                  </div>
                ))}
              </div>
            ) : <p className='text-sm text-muted-foreground text-center py-8'>No booking data yet</p>}
          </CardContent></Card>
        </div>
      </Main>
    </>
  )
}
