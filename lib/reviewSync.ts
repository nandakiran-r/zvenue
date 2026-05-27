import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { AppState, AppStateStatus } from 'react-native';
import { submitReview } from './reviewApi';
import type { PendingReview } from './types';

const STORAGE_KEY = 'pending_reviews';

// ─── Queue Management ──────────────────────────────────────────────────────

export async function getPendingReviews(): Promise<PendingReview[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

async function savePendingReviews(reviews: PendingReview[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
}

export async function queueReview(review: Omit<PendingReview, 'localId' | 'status' | 'retryCount'>): Promise<PendingReview> {
  const pending: PendingReview = {
    ...review,
    localId: `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    status: 'pending_sync',
    retryCount: 0,
  };

  const existing = await getPendingReviews();
  // Replace if same venue+user combo exists
  const filtered = existing.filter(
    (r) => !(r.venueId === pending.venueId && r.userId === pending.userId)
  );
  filtered.push(pending);
  await savePendingReviews(filtered);

  return pending;
}

export async function removePendingReview(localId: string): Promise<void> {
  const existing = await getPendingReviews();
  await savePendingReviews(existing.filter((r) => r.localId !== localId));
}

export async function updatePendingReviewStatus(
  localId: string,
  status: PendingReview['status'],
  serverId?: string
): Promise<void> {
  const existing = await getPendingReviews();
  const updated = existing.map((r) => {
    if (r.localId === localId) {
      return { ...r, status, ...(serverId && { serverId }) };
    }
    return r;
  });
  await savePendingReviews(updated);
}

// ─── Sync Logic ────────────────────────────────────────────────────────────

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function syncSingleReview(review: PendingReview): Promise<boolean> {
  try {
    const result = await submitReview(review.venueId, review.rating, review.comment || undefined);
    await updatePendingReviewStatus(review.localId, 'synced', result.id);
    return true;
  } catch (err: any) {
    const status = err?.response?.status;

    // Client error (4xx) — don't retry
    if (status && status >= 400 && status < 500) {
      await updatePendingReviewStatus(review.localId, 'sync_failed');
      return false;
    }

    // Server error (5xx) or network error — retry with backoff
    const maxRetries = 3;
    const backoffDelays = [2000, 4000, 8000];

    if (review.retryCount < maxRetries) {
      const delayMs = backoffDelays[review.retryCount] || 8000;
      await delay(delayMs);

      // Update retry count
      const pending = await getPendingReviews();
      const updated = pending.map((r) =>
        r.localId === review.localId ? { ...r, retryCount: r.retryCount + 1 } : r
      );
      await savePendingReviews(updated);

      // Retry
      return syncSingleReview({ ...review, retryCount: review.retryCount + 1 });
    }

    // Max retries exhausted
    await updatePendingReviewStatus(review.localId, 'sync_failed');
    return false;
  }
}

export async function syncPendingReviews(): Promise<void> {
  const netState = await NetInfo.fetch();
  if (!netState.isConnected) return;

  const pending = await getPendingReviews();
  const toSync = pending
    .filter((r) => r.status === 'pending_sync')
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  for (const review of toSync) {
    await syncSingleReview(review);
  }
}

// ─── Listeners ─────────────────────────────────────────────────────────────

let unsubscribeNetInfo: (() => void) | null = null;
let appStateSubscription: { remove: () => void } | null = null;

export function startSyncListeners(): void {
  // Listen for connectivity changes
  unsubscribeNetInfo = NetInfo.addEventListener((state) => {
    if (state.isConnected) {
      syncPendingReviews();
    }
  });

  // Listen for app coming to foreground
  const handleAppState = (nextState: AppStateStatus) => {
    if (nextState === 'active') {
      syncPendingReviews();
    }
  };
  appStateSubscription = AppState.addEventListener('change', handleAppState);
}

export function stopSyncListeners(): void {
  if (unsubscribeNetInfo) {
    unsubscribeNetInfo();
    unsubscribeNetInfo = null;
  }
  if (appStateSubscription) {
    appStateSubscription.remove();
    appStateSubscription = null;
  }
}
