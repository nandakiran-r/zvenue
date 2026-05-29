jest.mock('@react-native-async-storage/async-storage');

// Must define mock inside the factory to avoid hoisting issues
jest.mock('axios', () => {
  const mockInstance = {
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
  return { __esModule: true, default: { create: jest.fn(() => mockInstance) } };
});

import axios from 'axios';
import { fetchCategories, fetchVenues, fetchVenueById, fetchBookings, markAllNotificationsRead } from '@/lib/api';

// Get reference to the mock instance that was returned by axios.create()
const mockApi = (axios.create as jest.Mock).mock.results[0]?.value ?? (axios.create as jest.Mock)();

describe('API Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchCategories', () => {
    it('calls GET /api/categories and returns data', async () => {
      const mockData = [{ id: '1', name: 'Wedding', icon: 'celebration', sort_order: 0, created_at: '' }];
      mockApi.get.mockResolvedValueOnce({ data: mockData });

      const result = await fetchCategories();

      expect(mockApi.get).toHaveBeenCalledWith('/api/categories');
      expect(result).toEqual(mockData);
    });
  });

  describe('fetchVenues', () => {
    it('calls GET /api/venues with no params when no filters', async () => {
      const mockVenues = [{ id: 'v1', name: 'Venue 1', city: 'Mumbai', category: { name: 'Wedding' }, capacity: 100 }];
      mockApi.get.mockResolvedValueOnce({ data: mockVenues });

      const result = await fetchVenues();

      expect(mockApi.get).toHaveBeenCalledWith('/api/venues', { params: {} });
      expect(result).toEqual(mockVenues);
    });

    it('passes lat/lng/radius params when provided', async () => {
      mockApi.get.mockResolvedValueOnce({ data: [] });

      await fetchVenues({ lat: 19.07, lng: 72.87, radius: 5000 });

      expect(mockApi.get).toHaveBeenCalledWith('/api/venues', {
        params: { lat: 19.07, lng: 72.87, radius: 5000 },
      });
    });

    it('filters by categoryName client-side', async () => {
      const mockVenues = [
        { id: 'v1', name: 'Wedding Hall', city: 'Mumbai', category: { name: 'Wedding' }, capacity: 100 },
        { id: 'v2', name: 'Conference Room', city: 'Mumbai', category: { name: 'Corporate' }, capacity: 50 },
      ];
      mockApi.get.mockResolvedValueOnce({ data: mockVenues });

      const result = await fetchVenues({ categoryName: 'Wedding' });

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Wedding Hall');
    });

    it('filters by city client-side (case-insensitive)', async () => {
      const mockVenues = [
        { id: 'v1', name: 'Venue A', city: 'Mumbai', category: null, capacity: 100 },
        { id: 'v2', name: 'Venue B', city: 'Delhi', category: null, capacity: 50 },
      ];
      mockApi.get.mockResolvedValueOnce({ data: mockVenues });

      const result = await fetchVenues({ city: 'mumbai' });

      expect(result).toHaveLength(1);
      expect(result[0].city).toBe('Mumbai');
    });

    it('filters by minCapacity client-side', async () => {
      const mockVenues = [
        { id: 'v1', name: 'Small', city: 'Mumbai', category: null, capacity: 20 },
        { id: 'v2', name: 'Large', city: 'Mumbai', category: null, capacity: 200 },
      ];
      mockApi.get.mockResolvedValueOnce({ data: mockVenues });

      const result = await fetchVenues({ minCapacity: 100 });

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Large');
    });
  });

  describe('fetchVenueById', () => {
    it('returns venue data on success', async () => {
      const mockVenue = { id: 'v1', name: 'Test Venue' };
      mockApi.get.mockResolvedValueOnce({ data: mockVenue });

      const result = await fetchVenueById('v1');

      expect(mockApi.get).toHaveBeenCalledWith('/api/venues/v1');
      expect(result).toEqual(mockVenue);
    });

    it('returns null on error', async () => {
      mockApi.get.mockRejectedValueOnce(new Error('Not found'));

      const result = await fetchVenueById('invalid-id');

      expect(result).toBeNull();
    });
  });

  describe('fetchBookings', () => {
    it('passes user_id as query param', async () => {
      mockApi.get.mockResolvedValueOnce({ data: [] });

      await fetchBookings('user-123');

      expect(mockApi.get).toHaveBeenCalledWith('/api/bookings', { params: { user_id: 'user-123' } });
    });
  });

  describe('markAllNotificationsRead', () => {
    it('calls PATCH /api/notifications/read-all with user_id', async () => {
      mockApi.patch.mockResolvedValueOnce({ data: { success: true } });

      await markAllNotificationsRead('user-456');

      expect(mockApi.patch).toHaveBeenCalledWith('/api/notifications/read-all', { user_id: 'user-456' });
    });
  });
});
