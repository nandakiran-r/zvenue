/**
 * Deep link pending route storage
 * Used when a deep link arrives while the user is not authenticated.
 * After login, the stored route is consumed and navigated to.
 */

let pendingDeepLink: string | null = null;
let pendingTimestamp: number = 0;

const TIMEOUT_MS = 30_000; // 30 seconds — deep link expires if not consumed

/**
 * Store a deep link route to navigate to after authentication
 */
export function setPendingDeepLink(route: string): void {
  pendingDeepLink = route;
  pendingTimestamp = Date.now();
}

/**
 * Consume the pending deep link (returns it once, then clears it)
 * Returns null if no pending link or if it has expired
 */
export function consumePendingDeepLink(): string | null {
  if (!pendingDeepLink) return null;

  // Check if expired
  if (Date.now() - pendingTimestamp > TIMEOUT_MS) {
    pendingDeepLink = null;
    pendingTimestamp = 0;
    return null;
  }

  const route = pendingDeepLink;
  pendingDeepLink = null;
  pendingTimestamp = 0;
  return route;
}

/**
 * Check if there's a pending deep link without consuming it
 */
export function hasPendingDeepLink(): boolean {
  if (!pendingDeepLink) return false;
  if (Date.now() - pendingTimestamp > TIMEOUT_MS) {
    pendingDeepLink = null;
    return false;
  }
  return true;
}
