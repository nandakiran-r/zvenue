import { useAuthStore } from '@/store/authStore';
import { setPendingDeepLink } from '@/lib/deepLink';

/**
 * Deep link route resolution for zvenue-app:// URLs
 * Maps incoming deep links to expo-router paths
 * 
 * Supported URLs:
 *   zvenue-app://venue/{id}           → /venue-detail?id={id}
 *   zvenue-app://service/{id}         → /service-detail?id={id}
 *   zvenue-app://booking/{id}         → /view-booking?id={id}
 *   zvenue-app://service-booking/{id} → /view-service-booking?id={id}
 *   zvenue-app://subscription         → /subscription
 *   zvenue-app://home                 → /(tabs)/home
 */
export function redirectSystemPath({
  path,
  initial,
}: { path: string; initial: boolean }): string {
  // Strip leading slash and query params for matching
  const cleanPath = path.replace(/^\//, '').split('?')[0];
  const segments = cleanPath.split('/').filter(Boolean);

  if (segments.length === 0) return '/';

  const type = segments[0];
  const id = segments[1];

  let targetRoute: string | null = null;

  switch (type) {
    case 'venue':
      if (id) targetRoute = `/venue-detail?id=${id}`;
      break;
    case 'service':
      if (id) targetRoute = `/service-detail?id=${id}`;
      break;
    case 'booking':
      if (id) targetRoute = `/view-booking?id=${id}`;
      break;
    case 'service-booking':
      if (id) targetRoute = `/view-service-booking?id=${id}`;
      break;
    case 'subscription':
      targetRoute = '/subscription';
      break;
    case 'home':
      return '/(tabs)/home';
    default:
      return '/';
  }

  if (!targetRoute) return '/';

  // Auth guard: if user is not signed in, store the deep link and redirect to login
  const { isSignedIn } = useAuthStore.getState();
  if (!isSignedIn) {
    setPendingDeepLink(targetRoute);
    return '/login';
  }

  return targetRoute;
}
