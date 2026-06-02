/**
 * Geocoding service client using OpenStreetMap Nominatim.
 * 
 * Works well for Indian cities, areas, and known landmarks.
 * For specific venues/shrines, use the map click or pin drag feature.
 *
 * No API key required. Rate limit: 1 request per second.
 */

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';
const USER_AGENT = 'ZVenue-Admin/1.0';

export interface MapplsAutosuggestResult {
  eLoc: string;
  placeName: string;
  placeAddress: string;
  latitude: number;
  longitude: number;
  type: string;
  orderIndex: number;
}

export interface MapplsReverseResult {
  formatted_address: string;
  area: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
  locality: string;
  subLocality: string;
  street: string;
  houseNumber: string;
  lat: string;
  lng: string;
}

let lastRequestTime = 0;

async function rateLimitWait(): Promise<void> {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < 1100) {
    await new Promise((resolve) => setTimeout(resolve, 1100 - elapsed));
  }
  lastRequestTime = Date.now();
}

/**
 * Search for places/addresses in India.
 * Returns up to 5 results.
 * Tip: Search for area, city, or landmark names — not venue-specific names.
 */
export async function searchAddress(query: string): Promise<MapplsAutosuggestResult[]> {
  if (!query || query.trim().length < 3) return [];

  try {
    await rateLimitWait();

    // Append "India" if not already present to improve results
    let searchQuery = query.trim();
    if (!searchQuery.toLowerCase().includes('india')) {
      searchQuery += ', India';
    }

    const params = new URLSearchParams({
      q: searchQuery,
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
      console.error(`Geocoding search HTTP error: ${response.status}`);
      return [];
    }

    const results = await response.json();

    return results.slice(0, 5).map((item: any, index: number) => {
      // Build a clean place name from the display_name
      const parts = (item.display_name || '').split(',').map((s: string) => s.trim());
      const placeName = parts.slice(0, 2).join(', ');
      const placeAddress = parts.slice(2).join(', ');

      return {
        eLoc: String(item.place_id || ''),
        placeName,
        placeAddress,
        latitude: parseFloat(item.lat || '0'),
        longitude: parseFloat(item.lon || '0'),
        type: item.type || '',
        orderIndex: index,
      };
    });
  } catch (error) {
    console.error('Geocoding search error:', error);
    return [];
  }
}

/**
 * Reverse geocode: Get address from coordinates.
 * Returns address details or null on error.
 */
export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<MapplsReverseResult | null> {
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
      console.error(`Reverse geocoding HTTP error: ${response.status}`);
      return null;
    }

    const result = await response.json();
    if (!result || result.error) return null;

    const addr = result.address || {};
    return {
      formatted_address: result.display_name || '',
      area: addr.suburb || addr.neighbourhood || '',
      city: addr.city || addr.town || addr.village || addr.county || '',
      district: addr.county || addr.state_district || '',
      state: addr.state || '',
      pincode: addr.postcode || '',
      locality: addr.suburb || addr.neighbourhood || '',
      subLocality: addr.neighbourhood || '',
      street: addr.road || '',
      houseNumber: addr.house_number || '',
      lat: String(lat),
      lng: String(lng),
    };
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return null;
  }
}
