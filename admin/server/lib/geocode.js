/**
 * Geocoding service using OpenStreetMap Nominatim API
 * 
 * Free, no API key required. Just needs a User-Agent header.
 * Rate limit: 1 request per second (enforced by this module).
 * 
 * Docs: https://nominatim.org/release-docs/develop/api/Search/
 */

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const USER_AGENT = 'ZVenue/1.0 (venue-booking-app)';

let lastRequestTime = 0;

/**
 * Rate limiter — ensures at least 1 second between requests
 */
async function rateLimitWait() {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < 1100) {
    await new Promise(resolve => setTimeout(resolve, 1100 - elapsed));
  }
  lastRequestTime = Date.now();
}

/**
 * Geocode an address string to lat/lng coordinates
 * @param {string} address - Full address (e.g., "123 Main St, Mumbai, India")
 * @returns {{ latitude: number, longitude: number } | null}
 */
export async function geocodeAddress(address) {
  if (!address || address.trim().length === 0) {
    return null;
  }

  try {
    await rateLimitWait();

    const params = new URLSearchParams({
      q: address,
      format: 'json',
      limit: '1',
      countrycodes: 'in', // Restrict to India
    });

    const response = await fetch(`${NOMINATIM_URL}?${params.toString()}`, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`Geocoding HTTP error: ${response.status}`);
      return null;
    }

    const results = await response.json();

    if (results && results.length > 0) {
      const { lat, lon } = results[0];
      return {
        latitude: parseFloat(lat),
        longitude: parseFloat(lon),
      };
    }

    console.log(`Geocoding: No results for "${address}"`);
    return null;
  } catch (error) {
    console.error('Geocoding error:', error.message);
    return null;
  }
}

/**
 * Build a full address string from venue fields
 */
export function buildAddress(location, city) {
  const parts = [location, city, 'India'].filter(Boolean);
  return parts.join(', ');
}
