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
export const fetchVenues = (params?: { search?: string; category_id?: string; all?: string }) =>
  api.get('/api/venues', { params: { ...params, all: params?.all || 'true' } }).then(r => r.data)
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
export const confirmBookingPayment = (bookingId: string, transactionId: string) =>
  api.post('/api/admin/bookings/confirm-payment', { booking_id: bookingId, transaction_id: transactionId }).then(r => r.data)

// ─── Users ─────────────────────────────────────────────────────────────────
export const fetchUsers = (params?: { search?: string }) =>
  api.get('/api/users', { params }).then(r => r.data)
export const fetchUserDetail = (id: string) => api.get(`/api/users/${id}`).then(r => r.data)
export const deleteUser = (id: string) => api.delete(`/api/users/${id}`).then(r => r.data)

// ─── Notifications ─────────────────────────────────────────────────────────
export const fetchNotifications = (params?: { user_id?: string; owner_id?: string }) =>
  api.get('/api/notifications', { params }).then(r => r.data)

// ─── Subscribers ───────────────────────────────────────────────────────────
export const fetchSubscribers = (params?: { status?: string; search?: string }) =>
  api.get('/api/subscribers', { params }).then(r => r.data)
export const cancelUserSubscription = (id: string) =>
  api.post(`/api/subscribers/${id}/cancel`).then(r => r.data)
export const activateUserSubscription = (id: string) =>
  api.post(`/api/subscribers/${id}/activate`).then(r => r.data)

// ─── Subscription Benefits Config ──────────────────────────────────────────
export const fetchSubscriptionBenefits = () =>
  api.get('/api/config/subscription-benefits').then(r => r.data)
export const updateSubscriptionBenefits = (benefits: string[]) =>
  api.put('/api/config/subscription-benefits', { benefits }).then(r => r.data)

// ─── Owners ────────────────────────────────────────────────────────────────
export const fetchOwners = () => api.get('/api/owners').then(r => r.data)
export const createOwner = (data: Record<string, unknown>) => api.post('/api/owners', data).then(r => r.data)
export const updateOwner = (id: string, data: Record<string, unknown>) => api.put(`/api/owners/${id}`, data).then(r => r.data)
export const deleteOwner = (id: string) => api.delete(`/api/owners/${id}`).then(r => r.data)
export const approveVenue = (id: string) => api.post(`/api/venues/${id}/approve`).then(r => r.data)
export const rejectVenue = (id: string, reason?: string) => api.post(`/api/venues/${id}/reject`, { reason }).then(r => r.data)

// ─── Owner Portal ──────────────────────────────────────────────────────────
export const ownerLogin = (data: { email: string; password: string }) => api.post('/api/owners/login', data).then(r => r.data)
export const fetchOwnerProfile = () => api.get('/api/owners/me').then(r => r.data)
export const fetchOwnerVenues = () => api.get('/api/owners/venues').then(r => r.data)
export const createOwnerVenue = (data: Record<string, unknown>) => api.post('/api/owners/venues', data).then(r => r.data)
export const updateOwnerVenue = (id: string, data: Record<string, unknown>) => api.put(`/api/owners/venues/${id}`, data).then(r => r.data)
export const updateOwnerVenueBlockedDates = (id: string, blocked_dates: string[]) => api.put(`/api/owners/venues/${id}/blocked-dates`, { blocked_dates }).then(r => r.data)
export const fetchOwnerBookings = () => api.get('/api/owners/bookings').then(r => r.data)
export const fetchOwnerAnalytics = () => api.get('/api/owners/analytics').then(r => r.data)

// ─── Support Tickets ───────────────────────────────────────────────────────
export const fetchSupportTickets = (params?: { status?: string }) => api.get('/api/support-tickets', { params }).then(r => r.data)

// ─── Push Notifications ────────────────────────────────────────────────────
export const sendPushToUser = (user_id: string, title: string, body: string, data?: Record<string, unknown>) =>
  api.post('/api/push/send', { user_id, title, body, data }).then(r => r.data)
export const broadcastPush = (title: string, body: string, data?: Record<string, unknown>) =>
  api.post('/api/push/broadcast', { title, body, data }).then(r => r.data)
export const fetchMyTickets = () => api.get('/api/support-tickets/mine').then(r => r.data)
export const createSupportTicket = (data: { subject: string; description: string; priority?: string }) => api.post('/api/support-tickets', data).then(r => r.data)
export const replySupportTicket = (id: string, data: { admin_reply?: string; status?: string }) => api.put(`/api/support-tickets/${id}`, data).then(r => r.data)
export const createNotification = (data: Record<string, unknown>) =>
  api.post('/api/notifications', data).then(r => r.data)
export const broadcastNotification = (data: { title: string; body: string; type?: string }) =>
  api.post('/api/notifications/broadcast', data).then(r => r.data)
export const deleteNotification = (id: string) => api.delete(`/api/notifications/${id}`).then(r => r.data)

// ─── Reviews ───────────────────────────────────────────────────────────────
export interface AdminReview {
  id: string
  venue_id: string
  user_id: string
  rating: number
  comment: string | null
  created_at: string
  updated_at: string
  user?: { id: string; full_name: string | null; avatar_url: string | null }
  venue?: { id: string; name: string; city: string | null }
}

export interface AdminReviewsResponse {
  reviews: AdminReview[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

export const fetchAdminReviews = (params?: {
  page?: number
  limit?: number
  venue_id?: string
  rating?: number
  date_from?: string
  date_to?: string
}): Promise<AdminReviewsResponse> => api.get('/api/admin/reviews', { params }).then(r => r.data)

export const deleteAdminReview = (id: string) => api.delete(`/api/reviews/${id}`).then(r => r.data)

// ─── Service Marketplace ───────────────────────────────────────────────────

// Password Reset & Change
export const requestOwnerPasswordReset = (data: { email?: string; phone_number?: string }) =>
  api.post('/api/owners/request-password-reset', data).then(r => r.data)
export const verifyOwnerResetOtp = (data: { phone_number: string; otp: string; new_password: string }) =>
  api.post('/api/owners/verify-reset-otp', data).then(r => r.data)
export const changeOwnerPassword = (data: { current_password: string; new_password: string }) =>
  api.post('/api/owners/change-password', data).then(r => r.data)
export const requestAdminPasswordReset = (data: { email: string }) =>
  api.post('/api/admin/request-password-reset', data).then(r => r.data)
export const verifyAdminResetOtp = (data: { email: string; otp: string; new_password: string }) =>
  api.post('/api/admin/verify-reset-otp', data).then(r => r.data)
export const changeAdminPassword = (data: { current_password: string; new_password: string }) =>
  api.post('/api/admin/change-password', data).then(r => r.data)

// Service Categories
export const fetchServiceCategories = () => api.get('/api/service-categories').then(r => r.data)
export const fetchAdminServiceCategories = () => api.get('/api/admin/service-categories').then(r => r.data)
export const createServiceCategory = (data: Record<string, unknown>) => api.post('/api/service-categories', data).then(r => r.data)
export const updateServiceCategory = (id: string, data: Record<string, unknown>) => api.put(`/api/service-categories/${id}`, data).then(r => r.data)
export const deleteServiceCategory = (id: string) => api.delete(`/api/service-categories/${id}`).then(r => r.data)

// Service Listings
export const fetchServiceListings = (params?: Record<string, unknown>) => api.get('/api/service-listings', { params: { ...params, all: 'true' } }).then(r => r.data)
export const fetchServiceListing = (id: string) => api.get(`/api/service-listings/${id}`).then(r => r.data)
export const createServiceListing = (data: Record<string, unknown>) => api.post('/api/service-listings', data).then(r => r.data)
export const updateServiceListing = (id: string, data: Record<string, unknown>) => api.put(`/api/service-listings/${id}`, data).then(r => r.data)
export const deleteServiceListing = (id: string) => api.delete(`/api/service-listings/${id}`).then(r => r.data)
export const approveServiceListing = (id: string) => api.post(`/api/service-listings/${id}/approve`).then(r => r.data)
export const rejectServiceListing = (id: string) => api.post(`/api/service-listings/${id}/reject`).then(r => r.data)

// Service Bookings
export const fetchAdminServiceBookings = (params?: Record<string, unknown>) => api.get('/api/admin/service-bookings', { params }).then(r => r.data)
export const refundServiceBooking = (id: string, reason?: string) => api.post(`/api/admin/service-bookings/${id}/refund`, { reason }).then(r => r.data)

// Owner Services
export const fetchOwnerServices = () => api.get('/api/owners/services').then(r => r.data)
export const createOwnerService = (data: Record<string, unknown>) => api.post('/api/owners/services', data).then(r => r.data)
export const updateOwnerService = (id: string, data: Record<string, unknown>) => api.put(`/api/owners/services/${id}`, data).then(r => r.data)
export const updateOwnerServiceQuantity = (id: string, quantity: number) => api.put(`/api/owners/services/${id}/quantity`, { quantity_available: quantity }).then(r => r.data)
export const fetchOwnerServiceAnalytics = () => api.get('/api/owners/service-analytics').then(r => r.data)

export default api
