import { Share } from 'react-native';

const SCHEME = 'zvenue-app';

/**
 * Generate a shareable deep link URL for a venue
 */
export function getVenueShareUrl(id: string): string {
  return `${SCHEME}://venue/${id}`;
}

/**
 * Generate a shareable deep link URL for a service
 */
export function getServiceShareUrl(id: string): string {
  return `${SCHEME}://service/${id}`;
}

/**
 * Generate a shareable deep link URL for a booking
 */
export function getBookingShareUrl(id: string): string {
  return `${SCHEME}://booking/${id}`;
}

/**
 * Share a venue via the native share sheet
 */
export async function shareVenue(id: string, name: string): Promise<void> {
  try {
    await Share.share({
      message: `Check out ${name} on ZVenue! ${getVenueShareUrl(id)}`,
      title: name,
    });
  } catch (err) {
    // User cancelled or share failed — silently ignore
  }
}

/**
 * Share a service via the native share sheet
 */
export async function shareService(id: string, name: string): Promise<void> {
  try {
    await Share.share({
      message: `Check out ${name} on ZVenue! ${getServiceShareUrl(id)}`,
      title: name,
    });
  } catch (err) {
    // User cancelled or share failed — silently ignore
  }
}
