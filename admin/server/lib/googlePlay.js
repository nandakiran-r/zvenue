import { google } from 'googleapis';

const PACKAGE_NAME = process.env.GOOGLE_PLAY_PACKAGE_NAME || 'com.zvenue.app';

let androidPublisherClient = null;

function getClient() {
  if (androidPublisherClient) return androidPublisherClient;

  const rawCredentials = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON;
  if (!rawCredentials) {
    throw new Error('GOOGLE_PLAY_SERVICE_ACCOUNT_JSON is not set');
  }

  const credentials = JSON.parse(rawCredentials);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/androidpublisher'],
  });

  androidPublisherClient = google.androidpublisher({ version: 'v3', auth });
  return androidPublisherClient;
}

// Maps Play's subscriptionState to the status vocabulary already used across
// the app (is_subscribed checks for 'active'/'authenticated', admin UI, etc).
export function mapPlayStateToStatus(subscriptionState) {
  switch (subscriptionState) {
    case 'SUBSCRIPTION_STATE_ACTIVE':
    case 'SUBSCRIPTION_STATE_IN_GRACE_PERIOD':
      return 'active';
    case 'SUBSCRIPTION_STATE_ON_HOLD':
    case 'SUBSCRIPTION_STATE_PAUSED':
      return 'halted';
    case 'SUBSCRIPTION_STATE_CANCELED':
    case 'SUBSCRIPTION_STATE_EXPIRED':
      return 'cancelled';
    default:
      return 'cancelled';
  }
}

export async function getSubscriptionPurchase(purchaseToken) {
  const client = getClient();
  const { data } = await client.purchases.subscriptionsv2.get({
    packageName: PACKAGE_NAME,
    token: purchaseToken,
  });
  return data;
}

export async function acknowledgePurchase(subscriptionId, purchaseToken) {
  const client = getClient();
  await client.purchases.subscriptions.acknowledge({
    packageName: PACKAGE_NAME,
    subscriptionId,
    token: purchaseToken,
    requestBody: {},
  });
}

export function extractExpiryTime(playPurchase) {
  const lineItem = playPurchase.lineItems?.[0];
  return lineItem?.expiryTime ? new Date(lineItem.expiryTime).toISOString() : null;
}
