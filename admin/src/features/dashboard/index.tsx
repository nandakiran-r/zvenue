import { useQuery } from '@tanstack/react-query'
import {
  Building2,
  CalendarCheck,
  Users,
  IndianRupee,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  fetchDashboardStats,
  fetchRecentBookings,
  fetchRevenueChart,
  fetchBookingsByCategory,
  fetchTopVenues,
  fetchCityDistribution,
} from '@/lib/api'
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
} from 'recharts'

const COLORS = ['#7a3317', '#d4956b', '#f0c9a8', '#a85c3b', '#5c2511', '#c47a50', '#e8a87c', '#8b4726']

function formatINR(amount: number) {
  return `₹${amount.toLocaleString('en-IN')}`
}

function StatCard({
  title,
  value,
  icon: Icon,
  description,
  loading,
}: {
  title: string
  value: string | number
  icon: React.ElementType
  description?: string
  loading?: boolean
}) {
  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
        <CardTitle className='text-sm font-medium'>{title}</CardTitle>
        <Icon className='h-4 w-4 text-muted-foreground' />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className='h-8 w-24' />
        ) : (
          <>
            <div className='text-2xl font-bold'>{value}</div>
            {description && (
              <p className='text-xs text-muted-foreground'>{description}</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

export function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: fetchDashboardStats,
  })

  const { data: recentBookings, isLoading: recentLoading } = useQuery({
    queryKey: ['recent-bookings'],
    queryFn: fetchRecentBookings,
  })

  const { data: revenueData } = useQuery({
    queryKey: ['revenue-chart'],
    queryFn: fetchRevenueChart,
  })

  const { data: categoryData } = useQuery({
    queryKey: ['bookings-by-category'],
    queryFn: fetchBookingsByCategory,
  })

  const { data: topVenues } = useQuery({
    queryKey: ['top-venues'],
    queryFn: fetchTopVenues,
  })

  const { data: cityData } = useQuery({
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
        <div className='mb-2 flex items-center justify-between space-y-2'>
          <div>
            <h1 className='text-2xl font-bold tracking-tight'>Dashboard</h1>
            <p className='text-muted-foreground'>
              ZVenue platform overview and analytics
            </p>
          </div>
        </div>

        <Tabs
          orientation='vertical'
          defaultValue='overview'
          className='space-y-4'
        >
          <div className='w-full overflow-x-auto pb-2'>
            <TabsList>
              <TabsTrigger value='overview'>Overview</TabsTrigger>
              <TabsTrigger value='analytics'>Analytics</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value='overview' className='space-y-4'>
            {/* Stats Cards */}
            <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
              <StatCard
                title='Total Revenue'
                value={formatINR(stats?.totalRevenue || 0)}
                icon={IndianRupee}
                description={`From ${stats?.totalBookings || 0} bookings`}
                loading={statsLoading}
              />
              <StatCard
                title='Total Bookings'
                value={stats?.totalBookings || 0}
                icon={CalendarCheck}
                description={`${stats?.pendingBookings || 0} pending`}
                loading={statsLoading}
              />
              <StatCard
                title='Active Venues'
                value={stats?.totalVenues || 0}
                icon={Building2}
                description={`Across ${stats?.totalCategories || 0} categories`}
                loading={statsLoading}
              />
              <StatCard
                title='Registered Users'
                value={stats?.totalUsers || 0}
                icon={Users}
                description={`Avg. booking value ${formatINR(stats?.avgBookingValue || 0)}`}
                loading={statsLoading}
              />
            </div>

            {/* Booking Status Cards */}
            <div className='grid gap-4 sm:grid-cols-3'>
              <Card className='border-l-4 border-l-amber-500'>
                <CardContent className='flex items-center gap-4 pt-6'>
                  <div className='rounded-full bg-amber-100 p-3 dark:bg-amber-900/30'>
                    <Clock className='h-5 w-5 text-amber-600' />
                  </div>
                  <div>
                    <p className='text-sm text-muted-foreground'>Pending</p>
                    {statsLoading ? (
                      <Skeleton className='h-7 w-12' />
                    ) : (
                      <p className='text-2xl font-bold'>{stats?.pendingBookings || 0}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
              <Card className='border-l-4 border-l-emerald-500'>
                <CardContent className='flex items-center gap-4 pt-6'>
                  <div className='rounded-full bg-emerald-100 p-3 dark:bg-emerald-900/30'>
                    <CheckCircle2 className='h-5 w-5 text-emerald-600' />
                  </div>
                  <div>
                    <p className='text-sm text-muted-foreground'>Confirmed</p>
                    {statsLoading ? (
                      <Skeleton className='h-7 w-12' />
                    ) : (
                      <p className='text-2xl font-bold'>{stats?.confirmedBookings || 0}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
              <Card className='border-l-4 border-l-red-500'>
                <CardContent className='flex items-center gap-4 pt-6'>
                  <div className='rounded-full bg-red-100 p-3 dark:bg-red-900/30'>
                    <XCircle className='h-5 w-5 text-red-600' />
                  </div>
                  <div>
                    <p className='text-sm text-muted-foreground'>Cancelled</p>
                    {statsLoading ? (
                      <Skeleton className='h-7 w-12' />
                    ) : (
                      <p className='text-2xl font-bold'>{stats?.cancelledBookings || 0}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Revenue Chart + Recent Bookings */}
            <div className='grid grid-cols-1 gap-4 lg:grid-cols-7'>
              <Card className='col-span-1 lg:col-span-4'>
                <CardHeader>
                  <CardTitle>Revenue Overview</CardTitle>
                  <CardDescription>Monthly booking revenue</CardDescription>
                </CardHeader>
                <CardContent className='ps-2'>
                  <ResponsiveContainer width='100%' height={350}>
                    <BarChart data={revenueData || []}>
                      <CartesianGrid strokeDasharray='3 3' className='stroke-muted' />
                      <XAxis dataKey='month' className='text-xs' tick={{ fontSize: 12 }} />
                      <YAxis className='text-xs' tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                      <Tooltip
                        formatter={(value: number) => [formatINR(value), 'Revenue']}
                        contentStyle={{ borderRadius: 8, border: '1px solid hsl(var(--border))' }}
                      />
                      <Bar dataKey='revenue' fill='#7a3317' radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className='col-span-1 lg:col-span-3'>
                <CardHeader>
                  <CardTitle>Recent Bookings</CardTitle>
                  <CardDescription>Latest booking activity</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='space-y-4'>
                    {recentLoading
                      ? Array.from({ length: 5 }).map((_, i) => (
                          <div key={i} className='flex items-center gap-4'>
                            <Skeleton className='h-9 w-9 rounded-full' />
                            <div className='space-y-1'>
                              <Skeleton className='h-4 w-32' />
                              <Skeleton className='h-3 w-24' />
                            </div>
                            <Skeleton className='ml-auto h-4 w-16' />
                          </div>
                        ))
                      : (recentBookings || []).slice(0, 6).map((booking: any) => (
                          <div key={booking.id} className='flex items-center gap-4'>
                            <Avatar className='h-9 w-9'>
                              <AvatarImage src={booking.user?.avatar_url} />
                              <AvatarFallback>
                                {(booking.user?.full_name || 'U')[0].toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className='flex-1 space-y-1'>
                              <p className='text-sm font-medium leading-none'>
                                {booking.user?.full_name || 'Unknown User'}
                              </p>
                              <p className='text-xs text-muted-foreground'>
                                {booking.venue?.name || 'Unknown Venue'}
                              </p>
                            </div>
                            <div className='text-right'>
                              <p className='text-sm font-medium'>
                                {formatINR(booking.total || 0)}
                              </p>
                              <Badge
                                variant={
                                  booking.status === 'confirmed'
                                    ? 'default'
                                    : booking.status === 'pending'
                                      ? 'secondary'
                                      : 'destructive'
                                }
                                className='text-[10px]'
                              >
                                {booking.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Top Venues + City Distribution */}
            <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
              <Card>
                <CardHeader>
                  <CardTitle>Top Rated Venues</CardTitle>
                  <CardDescription>Highest rated venues on the platform</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='space-y-4'>
                    {(topVenues || []).map((venue: any, i: number) => (
                      <div key={venue.id} className='flex items-center gap-4'>
                        <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary'>
                          #{i + 1}
                        </div>
                        <Avatar className='h-10 w-10 rounded-lg'>
                          <AvatarImage src={venue.image_url} className='object-cover' />
                          <AvatarFallback className='rounded-lg'>
                            {venue.name?.[0] || 'V'}
                          </AvatarFallback>
                        </Avatar>
                        <div className='flex-1'>
                          <p className='text-sm font-medium'>{venue.name}</p>
                          <p className='text-xs text-muted-foreground'>
                            {venue.city} · {venue.category?.name}
                          </p>
                        </div>
                        <div className='text-right'>
                          <p className='text-sm font-bold'>⭐ {venue.rating}</p>
                          <p className='text-xs text-muted-foreground'>
                            {venue.review_count} reviews
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Venues by City</CardTitle>
                  <CardDescription>Distribution of venues across cities</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='space-y-3'>
                    {(cityData || []).slice(0, 8).map((city: any, i: number) => (
                      <div key={city.city} className='flex items-center gap-3'>
                        <span className='w-24 truncate text-sm'>{city.city}</span>
                        <div className='flex-1'>
                          <div className='h-2 overflow-hidden rounded-full bg-muted'>
                            <div
                              className='h-full rounded-full transition-all'
                              style={{
                                width: `${(city.count / Math.max(...(cityData || []).map((c: any) => c.count))) * 100}%`,
                                backgroundColor: COLORS[i % COLORS.length],
                              }}
                            />
                          </div>
                        </div>
                        <span className='w-8 text-right text-sm font-medium'>{city.count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value='analytics' className='space-y-4'>
            <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
              <Card>
                <CardHeader>
                  <CardTitle>Bookings by Category</CardTitle>
                  <CardDescription>Distribution of bookings across venue types</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width='100%' height={300}>
                    <PieChart>
                      <Pie
                        data={categoryData || []}
                        dataKey='count'
                        nameKey='name'
                        cx='50%'
                        cy='50%'
                        outerRadius={100}
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
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Revenue Trend</CardTitle>
                  <CardDescription>Monthly revenue growth</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width='100%' height={300}>
                    <BarChart data={revenueData || []}>
                      <CartesianGrid strokeDasharray='3 3' className='stroke-muted' />
                      <XAxis dataKey='month' tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(value: number) => [formatINR(value), 'Revenue']} />
                      <Bar dataKey='revenue' fill='#a85c3b' radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </Main>
    </>
  )
}
