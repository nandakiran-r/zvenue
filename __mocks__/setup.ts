// Global test setup
jest.mock('expo-constants', () => ({ default: { expoConfig: { extra: {} } } }));
jest.mock('expo-notifications', () => ({
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  getExpoPushTokenAsync: jest.fn(),
  setNotificationHandler: jest.fn(),
}));
