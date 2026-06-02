/**
 * Geocoding service using Photon (by Komoot).
 * 
 * Free, no API key, no signup required. Much better fuzzy matching than Nominatim.
 * Uses OpenStreetMap data with Elasticsearch for better search relevance.
 * 
 * Docs: https://photon.komoot.io/
 * 
 * For reverse geocoding, falls back to Nominatim (Photon doesn't support reverse).
 */

const PHOTON_URL = 'https://photon.komoot.io/api';
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/reverse';

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

let lastReverseTime = 0;

async function reverseRateLimitWait(): Promise<void> {
  const now = Date.now();
  const elapsed = now - lastReverseTime;
  if (elapsed < 1100) {
    await new Promise((resolve) => setTimeout(resolve, 1100 - elapsed));
  }
  lastReverseTime = Date.now();
}

/**
 * Forward geocode using Photon (Komoot).
 * Better fuzzy search than Nominatim — finds places, shrines, landmarks.
 * No API key needed. No rate limiting for reasonable usage.
 */
export async function searchAddress(query: string): Promise<MapplsAutosuggestResult[]> {
  if (!query || query.trim().length < 3) return [];

  try {
    // Append "india" for better relevance if not present
    let searchQuery = query.trim();
    if (!searchQuery.toLowerCase().includes('india')) {
      searchQuery += ' india';
    }

    const params = new URLSearchParams({
      q: searchQuery,
      limit: '20',
      lang: 'en',
    });

    const response = await fetch(`${PHOTON_URL}?${params.toString()}`, {
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      console.error(`Photon search HTTP error: ${response.status}`);
      return [];
    }

    const data = await response.json();
    const features = data.features || [];

    return features.slice(0, 20).map((feature: any, index: number) => {
      const props = feature.properties || {};
      const coords = feature.geometry?.coordinates || [0, 0];
      // Photon coordinates are [lng, lat]
      const lng = coords[0];
      const lat = coords[1];

      // Build place name and address
      const placeName = props.name || props.street || '';
      const addressParts: string[] = [];
      if (props.street && props.street !== placeName) addressParts.push(props.street);
      if (props.city) addressParts.push(props.city);
      if (props.state) addressParts.push(props.state);
      if (props.postcode) addressParts.push(props.postcode);
      const placeAddress = addressParts.join(', ');

      return {
        eLoc: String(props.osm_id || index),
        placeName: placeName || placeAddress.split(',')[0] || 'Unknown',
        placeAddress,
        latitude: lat,
        longitude: lng,
        type: props.osm_value || props.type || '',
        orderIndex: index,
      };
    });
  } catch (error) {
    console.error('Photon search error:', error);
    return [];
  }
}

/**
 * Reverse geocode using Nominatim (Photon doesn't support reverse geocoding).
 * Rate limited to 1 req/sec per Nominatim policy.
 */
export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<MapplsReverseResult | null> {
  try {
    await reverseRateLimitWait();

    const params = new URLSearchParams({
      lat: String(lat),
      lon: String(lng),
      format: 'json',
      addressdetails: '1',
    });

    const response = await fetch(`${NOMINATIM_URL}?${params.toString()}`, {
      headers: {
        'User-Agent': 'ZVenue-Admin/1.0',
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
