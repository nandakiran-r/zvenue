import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock the api module before importing the store
const mockGet = jest.fn();
jest.mock('@/lib/api', () => ({
  api: { get: (...args: any[]) => mockGet(...args) },
  fetchUser: jest.fn(),
  getSubscriptionStatus: jest.fn(() => Promise.resolve({ is_subscribed: false, subscription_status: 'none', subscription_id: null, next_billing_at: null })),
}));

import { useAuthStore } from '@/store/authStore';

describe('authStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    useAuthStore.setState({
      isSignedIn: false,
      isLoaded: false,
      userId: null,
      dbUser: null,
      subscriptionInfo: null,
      isSubscribed: false,
    });
    jest.clearAllMocks();
    (AsyncStorage as any).__reset?.();
  });

  describe('login', () => {
    it('sets isSignedIn, userId, and dbUser', async () => {
      const mockUser = { id: 'user-1', full_name: 'Test User', email: 'test@test.com', phone_number: '+911234567890', avatar_url: null, subscription_id: null, subscription_status: null, subscription_source: null, next_billing_at: null, first_name: 'Test', last_name: 'User', address: null, pincode: null, created_at: '2024-01-01' };

      await useAuthStore.getState().login('test-token-123', mockUser);

      const state = useAuthStore.getState();
      expect(state.isSignedIn).toBe(true);
      expect(state.userId).toBe('user-1');
      expect(state.dbUser).toEqual(mockUser);
    });

    it('persists token to AsyncStorage', async () => {
      const mockUser = { id: 'user-1', full_name: 'Test', email: null, phone_number: '+911234567890', avatar_url: null, subscription_id: null, subscription_status: null, subscription_source: null, next_billing_at: null, first_name: 'Test', last_name: '', address: null, pincode: null, created_at: '2024-01-01' };

      await useAuthStore.getState().login('my-jwt-token', mockUser);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith('token', 'my-jwt-token');
    });
  });

  describe('signOut', () => {
    it('clears state and removes token', async () => {
      // First login
      const mockUser = { id: 'user-1', full_name: 'Test', email: null, phone_number: '+911234567890', avatar_url: null, subscription_id: null, subscription_status: null, subscription_source: null, next_billing_at: null, first_name: 'Test', last_name: '', address: null, pincode: null, created_at: '2024-01-01' };
      await useAuthStore.getState().login('token', mockUser);

      // Then sign out
      await useAuthStore.getState().signOut();

      const state = useAuthStore.getState();
      expect(state.isSignedIn).toBe(false);
      expect(state.userId).toBeNull();
      expect(state.dbUser).toBeNull();
      expect(state.subscriptionInfo).toBeNull();
      expect(state.isSubscribed).toBe(false);
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('token');
    });
  });

  describe('initialize', () => {
    it('restores session when token exists', async () => {
      const mockUser = { id: 'user-2', full_name: 'Restored User', email: 'r@test.com', phone_number: '+919876543210', avatar_url: null, subscription_id: null, subscription_status: null, subscription_source: null, next_billing_at: null, first_name: 'Restored', last_name: 'User', address: null, pincode: null, created_at: '2024-01-01' };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('stored-token');
      mockGet.mockResolvedValueOnce({ data: mockUser });

      await useAuthStore.getState().initialize();

      const state = useAuthStore.getState();
      expect(state.isSignedIn).toBe(true);
      expect(state.userId).toBe('user-2');
      expect(state.dbUser).toEqual(mockUser);
      expect(state.isLoaded).toBe(true);
    });

    it('stays unauthenticated when no token exists', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

      await useAuthStore.getState().initialize();

      const state = useAuthStore.getState();
      expect(state.isSignedIn).toBe(false);
      expect(state.userId).toBeNull();
      expect(state.isLoaded).toBe(true);
    });

    it('clears state when token is invalid (API returns error)', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('expired-token');
      mockGet.mockRejectedValueOnce(new Error('Unauthorized'));

      await useAuthStore.getState().initialize();

      const state = useAuthStore.getState();
      expect(state.isSignedIn).toBe(false);
      expect(state.userId).toBeNull();
      expect(state.isLoaded).toBe(true);
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('token');
    });
  });
});
