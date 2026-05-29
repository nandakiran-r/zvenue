jest.mock('@react-native-async-storage/async-storage');

// The mock must be fully self-contained inside the factory due to Jest hoisting
jest.mock('axios', () => {
  const instance = {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() },
    },
    defaults: { headers: { common: {} } },
  };
  return {
    __esModule: true,
    default: { create: jest.fn(() => instance) },
    __mockInstance: instance,
  };
});

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { __mockInstance: mockApi } = require('axios');

import {
  fetchServiceCategories,
  fetchServiceListings,
  fetchServiceBookedDates,
  searchAll,
  addServiceFavorite,
  removeServiceFavorite,
  cancelServiceBooking,
  createServiceOrder,
} from '@/lib/serviceApi';

describe('Service API Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchServiceCategories', () => {
    it('calls GET /api/service-categories', async () => {
      const mockData = [{ id: '1', name: 'Catering', icon: 'utensils', sort_order: 0, is_active: true }];
      mockApi.get.mockResolvedValueOnce({ data: mockData });

      const result = await fetchServiceCategories();

      expect(mockApi.get).toHaveBeenCalledWith('/api/service-categories');
      expect(result).toEqual(mockData);
    });
  });

  describe('fetchServiceListings', () => {
    it('calls GET /api/service-listings with params', async () => {
      mockApi.get.mockResolvedValueOnce({ data: [] });

      await fetchServiceListings({ category_id: 'cat-1', page: 2, limit: 20 });

      expect(mockApi.get).toHaveBeenCalledWith('/api/service-listings', {
        params: { category_id: 'cat-1', page: 2, limit: 20 },
      });
    });

    it('calls without params when none provided', async () => {
      mockApi.get.mockResolvedValueOnce({ data: [] });

      await fetchServiceListings();

      expect(mockApi.get).toHaveBeenCalledWith('/api/service-listings', { params: undefined });
    });
  });

  describe('fetchServiceBookedDates', () => {
    it('calls GET /api/service-listings/:id/booked-dates', async () => {
      const mockData = { bookings: [{ booking_date: '2026-06-01', start_time: '08:00 AM', end_time: '12:00 PM' }], blocked_dates: [] };
      mockApi.get.mockResolvedValueOnce({ data: mockData });

      const result = await fetchServiceBookedDates('listing-1');

      expect(mockApi.get).toHaveBeenCalledWith('/api/service-listings/listing-1/booked-dates');
      expect(result).toEqual(mockData);
    });

    it('handles legacy array format', async () => {
      const mockData = [{ booking_date: '2026-06-01', start_time: '08:00 AM', end_time: '12:00 PM' }];
      mockApi.get.mockResolvedValueOnce({ data: mockData });

      const result = await fetchServiceBookedDates('listing-1');

      expect(result).toEqual({ bookings: mockData, blocked_dates: [] });
    });
  });

  describe('searchAll', () => {
    it('calls GET /api/search with query and type params', async () => {
      const mockResults = { venues: [], services: [] };
      mockApi.get.mockResolvedValueOnce({ data: mockResults });

      const result = await searchAll('Royal', 'venues');

      expect(mockApi.get).toHaveBeenCalledWith('/api/search', { params: { q: 'Royal', type: 'venues' } });
      expect(result).toEqual(mockResults);
    });

    it('defaults type to all', async () => {
      mockApi.get.mockResolvedValueOnce({ data: { venues: [], services: [] } });

      await searchAll('test');

      expect(mockApi.get).toHaveBeenCalledWith('/api/search', { params: { q: 'test', type: 'all' } });
    });
  });

  describe('addServiceFavorite', () => {
    it('calls POST /api/service-favorites with listing ID', async () => {
      mockApi.post.mockResolvedValueOnce({ data: { success: true } });

      const result = await addServiceFavorite('listing-123');

      expect(mockApi.post).toHaveBeenCalledWith('/api/service-favorites', { service_listing_id: 'listing-123' });
      expect(result).toEqual({ success: true });
    });
  });

  describe('removeServiceFavorite', () => {
    it('calls DELETE /api/service-favorites/:id', async () => {
      mockApi.delete.mockResolvedValueOnce({ data: { success: true } });

      const result = await removeServiceFavorite('listing-456');

      expect(mockApi.delete).toHaveBeenCalledWith('/api/service-favorites/listing-456');
      expect(result).toEqual({ success: true });
    });
  });

  describe('cancelServiceBooking', () => {
    it('sends reason in POST body', async () => {
      mockApi.post.mockResolvedValueOnce({ data: { success: true, message: 'Cancelled' } });

      const result = await cancelServiceBooking('booking-1', 'Changed my mind');

      expect(mockApi.post).toHaveBeenCalledWith('/api/service-bookings/booking-1/cancel', { reason: 'Changed my mind' });
      expect(result).toEqual({ success: true, message: 'Cancelled' });
    });
  });

  describe('createServiceOrder', () => {
    it('sends booking_date, start_time, end_time in POST body', async () => {
      const mockResponse = { order: { id: 'ord-1', amount: 50000 }, booking: { id: 'bk-1' }, listing: { name: 'Test' } };
      mockApi.post.mockResolvedValueOnce({ data: mockResponse });

      const input = {
        service_listing_id: 'svc-1',
        quantity: 2,
        booking_date: '2026-06-15',
        start_time: '08:00 AM',
        end_time: '12:00 PM',
      };

      const result = await createServiceOrder(input);

      expect(mockApi.post).toHaveBeenCalledWith('/api/service-bookings/create-order', input);
      expect(result).toEqual(mockResponse);
    });
  });
});
