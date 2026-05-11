import { useQuery } from '@tanstack/react-query'
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  AreaChart,
  Area,
} from 'recharts'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import {
  fetchRevenueChart,
  fetchBookingsByCategory,
  fetchCityDistribution,
  fetchDashboardStats,
} from '@/lib/api'

const COLORS = ['#7a3317', '#d4956b', '#f0c9a8', '#a85c3b', '#5c2511', '#c47a50', '#e8a87c', '#8b4726']

function formatINR(amount: number) {
  return `₹${(amount || 0).toLocaleString('en-IN')}`
}

export function AnalyticsPage() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: fetchDashboardStats,
  })

  const { data: revenueData, isLoading: revenueLoading } = useQuery({
    queryKey: ['revenue-chart'],
    queryFn: fetchRevenueChart,
  })

  const { data: categoryData, isLoading: categoryLoading } = useQuery({
    queryKey: ['bookings-by-category'],
    queryFn: fetchBookingsByCategory,
  })

  const { data: cityData, isLoading: cityLoading } = useQuery({
    queryKey: ['city-distribution'],
    queryFn: fetchCityDistribution,
  })

  return (
    <>
      <Header>
        <Search className='me-auto' />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>

      <Main>
        <div className='mb-6'>
          <h1 className='text-2xl font-bold tracking-tight'>Analytics</h1>
          <p className='text-muted-foreground'>
            Detailed platform analytics and insights
          </p>
        </div>

        <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
          {/* Revenue Trend */}
          <Card className='lg:col-span-2'>
            <CardHeader>
              <CardTitle>Revenue Trend</CardTitle>
              <CardDescription>Monthly booking revenue over time</CardDescription>
            </CardHeader>
            <CardContent>
              {revenueLoading ? (
                <Skeleton className='h-[350px] w-full' />
              ) : (
                <ResponsiveContainer width='100%' height={350}>
                  <AreaChart data={revenueData || []}>
                    <defs>
                      <linearGradient id='revenueGradient' x1='0' y1='0' x2='0' y2='1'>
                        <stop offset='5%' stopColor='#7a3317' stopOpacity={0.3} />
                        <stop offset='95%' stopColor='#7a3317' stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray='3 3' className='stroke-muted' />
                    <XAxis dataKey='month' tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(value: number) => [formatINR(value), 'Revenue']} />
                    <Area
                      type='monotone'
                      dataKey='revenue'
                      stroke='#7a3317'
                      fillOpacity={1}
                      fill='url(#revenueGradient)'
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Bookings by Category */}
          <Card>
            <CardHeader>
              <CardTitle>Bookings by Category</CardTitle>
              <CardDescription>Distribution of bookings across venue types</CardDescription>
            </CardHeader>
            <CardContent>
              {categoryLoading ? (
                <Skeleton className='h-[300px] w-full' />
              ) : (
                <ResponsiveContainer width='100%' height={300}>
                  <PieChart>
                    <Pie
                      data={categoryData || []}
                      dataKey='count'
                      nameKey='name'
                      cx='50%'
                      cy='50%'
                      outerRadius={100}
                      innerRadius={60}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {(categoryData || []).map((_: any, i: number) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Venues by City */}
          <Card>
            <CardHeader>
              <CardTitle>Venues by City</CardTitle>
              <CardDescription>Number of venues in each city</CardDescription>
            </CardHeader>
            <CardContent>
              {cityLoading ? (
                <Skeleton className='h-[300px] w-full' />
              ) : (
                <ResponsiveContainer width='100%' height={300}>
                  <BarChart data={(cityData || []).slice(0, 10)} layout='vertical'>
                    <CartesianGrid strokeDasharray='3 3' className='stroke-muted' />
                    <XAxis type='number' tick={{ fontSize: 12 }} />
                    <YAxis dataKey='city' type='category' tick={{ fontSize: 12 }} width={80} />
                    <Tooltip />
                    <Bar dataKey='count' fill='#a85c3b' radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Booking Status Overview */}
          <Card className='lg:col-span-2'>
            <CardHeader>
              <CardTitle>Booking Status Summary</CardTitle>
              <CardDescription>Current breakdown of booking statuses</CardDescription>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className='h-[200px] w-full' />
              ) : (
                <div className='grid grid-cols-1 gap-6 sm:grid-cols-3'>
                  <div className='flex flex-col items-center rounded-xl border bg-amber-50 dark:bg-amber-950/20 p-6'>
                    <p className='text-4xl font-bold text-amber-600'>{stats?.pendingBookings || 0}</p>
                    <p className='text-sm text-muted-foreground mt-1'>Pending</p>
                  </div>
                  <div className='flex flex-col items-center rounded-xl border bg-emerald-50 dark:bg-emerald-950/20 p-6'>
                    <p className='text-4xl font-bold text-emerald-600'>{stats?.confirmedBookings || 0}</p>
                    <p className='text-sm text-muted-foreground mt-1'>Confirmed</p>
                  </div>
                  <div className='flex flex-col items-center rounded-xl border bg-red-50 dark:bg-red-950/20 p-6'>
                    <p className='text-4xl font-bold text-red-600'>{stats?.cancelledBookings || 0}</p>
                    <p className='text-sm text-muted-foreground mt-1'>Cancelled</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </Main>
    </>
  )
}
