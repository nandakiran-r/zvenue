import { Platform } from "react-native";
import {
  initConnection,
  fetchProducts,
  requestPurchase,
  finishTransaction,
  purchaseUpdatedListener,
  purchaseErrorListener,
  deepLinkToSubscriptions,
  type Purchase,
  type PurchaseError,
  type ProductSubscriptionAndroid,
  type EventSubscription,
} from "react-native-iap";

// Must match the subscription product created in Play Console exactly.
export const PLAY_SUBSCRIPTION_SKU = "zvenue_pro";
export const PLAY_PACKAGE_NAME = "com.zvenue.app";

// Mirrors the PLANS keys in app/subscription.tsx — must match the base plan
// IDs configured under the zvenue_pro product in Play Console.
export const BASE_PLAN_IDS: Record<"monthly" | "halfyearly" | "yearly", string> = {
  monthly: "monthly",
  halfyearly: "half-yearly",
  yearly: "yearly",
};

export interface AndroidSubscriptionOffer {
  basePlanId: string;
  offerToken: string;
  formattedPrice: string;
}

let connected = false;

export async function initGoogleIAP(): Promise<void> {
  if (connected || Platform.OS !== "android") return;
  await initConnection();
  connected = true;
}

export async function fetchAndroidOffers(): Promise<AndroidSubscriptionOffer[]> {
  const products = await fetchProducts({ skus: [PLAY_SUBSCRIPTION_SKU], type: "subs" });
  const subscription = (products as ProductSubscriptionAndroid[] | null)?.find(
    (p) => p.id === PLAY_SUBSCRIPTION_SKU
  );
  if (!subscription) return [];

  return (subscription.subscriptionOffers || [])
    .filter((offer) => offer.basePlanIdAndroid && offer.offerTokenAndroid)
    .map((offer) => ({
      basePlanId: offer.basePlanIdAndroid as string,
      offerToken: offer.offerTokenAndroid as string,
      formattedPrice: offer.displayPrice,
    }));
}

export async function purchaseAndroidSubscription(offerToken: string): Promise<void> {
  await requestPurchase({
    request: {
      google: {
        skus: [PLAY_SUBSCRIPTION_SKU],
        subscriptionOffers: [{ sku: PLAY_SUBSCRIPTION_SKU, offerToken }],
      },
    },
    type: "subs",
  });
}

export function onPurchaseUpdated(listener: (purchase: Purchase) => void): EventSubscription {
  return purchaseUpdatedListener(listener);
}

export function onPurchaseError(listener: (error: PurchaseError) => void): EventSubscription {
  return purchaseErrorListener(listener);
}

export async function finishAndroidPurchase(purchase: Purchase): Promise<void> {
  await finishTransaction({ purchase, isConsumable: false });
}

export async function openPlayManageSubscriptions(): Promise<void> {
  await deepLinkToSubscriptions({
    skuAndroid: PLAY_SUBSCRIPTION_SKU,
    packageNameAndroid: PLAY_PACKAGE_NAME,
  });
}
