import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ─── Dashboard ─────────────────────────────────────────────────────────────
export const fetchDashboardStats = () => api.get('/api/dashboard/stats').then(r => r.data)
export const fetchRecentBookings = () => api.get('/api/dashboard/recent-bookings').then(r => r.data)
export const fetchRevenueChart = () => api.get('/api/dashboard/revenue-chart').then(r => r.data)
export const fetchBookingsByCategory = () => api.get('/api/dashboard/bookings-by-category').then(r => r.data)
export const fetchTopVenues = () => api.get('/api/dashboard/top-venues').then(r => r.data)
export const fetchCityDistribution = () => api.get('/api/dashboard/city-distribution').then(r => r.data)

// ─── Venues ────────────────────────────────────────────────────────────────
export const fetchVenues = (params?: { search?: string; category_id?: string }) =>
  api.get('/api/venues', { params }).then(r => r.data)
export const fetchVenue = (id: string) => api.get(`/api/venues/${id}`).then(r => r.data)
export const fetchVenueBookedDates = (id: string) => api.get(`/api/venues/${id}/booked-dates`).then(r => r.data)
export const createVenue = (data: Record<string, unknown>) => api.post('/api/venues', data).then(r => r.data)
export const updateVenue = (id: string, data: Record<string, unknown>) =>
  api.put(`/api/venues/${id}`, data).then(r => r.data)
export const deleteVenue = (id: string) => api.delete(`/api/venues/${id}`).then(r => r.data)

// ─── Categories ────────────────────────────────────────────────────────────
export const fetchCategories = () => api.get('/api/categories').then(r => r.data)
export const createCategory = (data: Record<string, unknown>) =>
  api.post('/api/categories', data).then(r => r.data)
export const updateCategory = (id: string, data: Record<string, unknown>) =>
  api.put(`/api/categories/${id}`, data).then(r => r.data)
export const deleteCategory = (id: string) => api.delete(`/api/categories/${id}`).then(r => r.data)

// ─── Bookings ──────────────────────────────────────────────────────────────
export const fetchBookings = (params?: { status?: string; search?: string }) =>
  api.get('/api/bookings', { params }).then(r => r.data)
export const fetchBooking = (id: string) => api.get(`/api/bookings/${id}`).then(r => r.data)
export const updateBooking = (id: string, data: Record<string, unknown>) =>
  api.put(`/api/bookings/${id}`, data).then(r => r.data)
export const deleteBooking = (id: string) => api.delete(`/api/bookings/${id}`).then(r => r.data)

// ─── Users ─────────────────────────────────────────────────────────────────
export const fetchUsers = (params?: { search?: string }) =>
  api.get('/api/users', { params }).then(r => r.data)
export const fetchUserDetail = (id: string) => api.get(`/api/users/${id}`).then(r => r.data)
export const deleteUser = (id: string) => api.delete(`/api/users/${id}`).then(r => r.data)

// ─── Notifications ─────────────────────────────────────────────────────────
export const fetchNotifications = (params?: { user_id?: string }) =>
  api.get('/api/notifications', { params }).then(r => r.data)
export const createNotification = (data: Record<string, unknown>) =>
  api.post('/api/notifications', data).then(r => r.data)
export const broadcastNotification = (data: { title: string; body: string; type?: string }) =>
  api.post('/api/notifications/broadcast', data).then(r => r.data)
export const deleteNotification = (id: string) => api.delete(`/api/notifications/${id}`).then(r => r.data)

export default api
