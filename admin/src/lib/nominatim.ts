/**
 * Nominatim geocoding service client for the admin panel.
 *
 * Uses OpenStreetMap Nominatim API for forward and reverse geocoding.
 * Enforces a minimum 1-second interval between requests per Nominatim usage policy.
 *
 * Docs: https://nominatim.org/release-docs/develop/api/Search/
 */

export interface NominatimSearchResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    road?: string;
    house_number?: string;
    suburb?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    country?: string;
  };
}

export interface NominatimReverseResult {
  display_name: string;
  address: {
    road?: string;
    house_number?: string;
    suburb?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    country?: string;
  };
}

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';
const USER_AGENT = 'ZVenue-Admin/1.0';
const MIN_REQUEST_INTERVAL_MS = 1100;

let lastRequestTime = 0;

/**
 * Rate limiter — ensures at least 1 second between requests to comply
 * with Nominatim usage policy.
 */
async function rateLimitWait(): Promise<void> {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < MIN_REQUEST_INTERVAL_MS) {
    await new Promise((resolve) => setTimeout(resolve, MIN_REQUEST_INTERVAL_MS - elapsed));
  }
  lastRequestTime = Date.now();
}

/**
 * Forward geocode: search for addresses matching the given query.
 * Returns up to 5 results restricted to India.
 * Returns an empty array on error.
 */
export async function searchAddress(query: string): Promise<NominatimSearchResult[]> {
  if (!query || query.trim().length === 0) {
    return [];
  }

  try {
    await rateLimitWait();

    const params = new URLSearchParams({
      q: query,
      format: 'json',
      limit: '5',
      countrycodes: 'in',
      addressdetails: '1',
    });

    const response = await fetch(`${NOMINATIM_BASE_URL}/search?${params.toString()}`, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`Nominatim search HTTP error: ${response.status}`);
      return [];
    }

    const results: NominatimSearchResult[] = await response.json();
    return results.slice(0, 5);
  } catch (error) {
    console.error('Nominatim search error:', error);
    return [];
  }
}

/**
 * Reverse geocode: get address information from coordinates.
 * Returns null on error.
 */
export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<NominatimReverseResult | null> {
  try {
    await rateLimitWait();

    const params = new URLSearchParams({
      lat: String(lat),
      lon: String(lng),
      format: 'json',
      addressdetails: '1',
    });

    const response = await fetch(`${NOMINATIM_BASE_URL}/reverse?${params.toString()}`, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`Nominatim reverse HTTP error: ${response.status}`);
      return null;
    }

    const result: NominatimReverseResult = await response.json();
    return result;
  } catch (error) {
    console.error('Nominatim reverse geocoding error:', error);
    return null;
  }
}
