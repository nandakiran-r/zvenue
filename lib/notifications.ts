/**
 * Push Notifications utility
 * 
 * NOTE: Push notifications do NOT work in Expo Go (SDK 53+).
 * They only work in development builds (EAS Build).
 * All functions here are safe to call in Expo Go — they'll just return null/no-op.
 */

import { Platform } from 'react-native';
import { api } from './api';

let Notifications: any = null;
let Device: any = null;
let Constants: any = null;

// Lazy-load notification modules (they crash in Expo Go)
try {
  Notifications = require('expo-notifications');
  Device = require('expo-device');
  Constants = require('expo-constants');

  // Configure how notifications appear when app is in foreground
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
} catch (e) {
  console.log('Push notifications not available (Expo Go). Use a development build for push.');
}

/**
 * Register for push notifications and return the Expo push token
 */
export async function registerForPushNotifications(): Promise<string | null> {
  if (!Notifications || !Device || !Constants) return null;

  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Push notification permission not granted');
      return null;
    }

    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    const token = tokenData.data;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#7a3317',
      });
    }

    return token;
  } catch (error) {
    console.log('Push token registration failed (expected in Expo Go):', (error as any)?.message);
    return null;
  }
}

/**
 * Save the push token to the backend
 */
export async function savePushToken(pushToken: string): Promise<void> {
  try {
    await api.post('/api/push-token', { push_token: pushToken });
  } catch (error) {
    console.error('Failed to save push token:', error);
  }
}

/**
 * Add a listener for notification taps (no-op if not available)
 */
export function addNotificationResponseListener(
  callback: (response: any) => void
) {
  if (!Notifications) return { remove: () => {} };
  return Notifications.addNotificationResponseReceivedListener(callback);
}
