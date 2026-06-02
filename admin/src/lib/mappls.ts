/**
 * Mappls (MapmyIndia) geocoding service client for the admin panel.
 *
 * Uses Mappls REST APIs for autosuggest (forward geocoding) and reverse geocoding.
 * Provides much better Indian address coverage than OpenStreetMap/Nominatim.
 *
 * API Key: Get from https://auth.mappls.com/console/
 * Docs: https://github.com/mappls-api/mappls-rest-apis
 */

const MAPPLS_API_KEY = import.meta.env.VITE_MAPPLS_API_KEY || '';

export interface MapplsAutosuggestResult {
  eLoc: string; // Mappls unique place ID
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

/**
 * Autosuggest: Search for places/addresses in India.
 * Returns up to 5 results.
 */
export async function searchAddress(query: string): Promise<MapplsAutosuggestResult[]> {
  if (!query || query.trim().length < 3) return [];
  if (!MAPPLS_API_KEY) {
    console.warn('Mappls API key not configured (VITE_MAPPLS_API_KEY). Falling back to empty results.');
    return [];
  }

  try {
    const params = new URLSearchParams({
      query: query.trim(),
      location: '20.5937,78.9629', // Center of India for relevance bias
      region: 'IND',
      tokenizeAddress: 'true',
    });

    const response = await fetch(
      `https://atlas.mappls.com/api/places/search/json?${params.toString()}`,
      {
        headers: {
          'Authorization': `bearer ${MAPPLS_API_KEY}`,
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error(`Mappls autosuggest HTTP error: ${response.status}`);
      return [];
    }

    const data = await response.json();
    const results = data.suggestedLocations || data.results || [];

    return results.slice(0, 5).map((item: any, index: number) => ({
      eLoc: item.eLoc || item.place_id || '',
      placeName: item.placeName || item.place_name || '',
      placeAddress: item.placeAddress || item.formatted_address || item.description || '',
      latitude: parseFloat(item.latitude || item.lat || '0'),
      longitude: parseFloat(item.longitude || item.lng || '0'),
      type: item.type || '',
      orderIndex: index,
    }));
  } catch (error) {
    console.error('Mappls autosuggest error:', error);
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
  if (!MAPPLS_API_KEY) {
    console.warn('Mappls API key not configured (VITE_MAPPLS_API_KEY).');
    return null;
  }

  try {
    const response = await fetch(
      `https://apis.mappls.com/advancedmaps/v1/${MAPPLS_API_KEY}/rev_geocode?lat=${lat}&lng=${lng}`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error(`Mappls reverse geocode HTTP error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const results = data.results || [];

    if (results.length === 0) return null;

    const result = results[0];
    return {
      formatted_address: result.formatted_address || '',
      area: result.area || '',
      city: result.city || result.district || '',
      district: result.district || '',
      state: result.state || '',
      pincode: result.pincode || '',
      locality: result.locality || '',
      subLocality: result.subLocality || result.sub_locality || '',
      street: result.street || '',
      houseNumber: result.houseNumber || result.house_number || '',
      lat: String(lat),
      lng: String(lng),
    };
  } catch (error) {
    console.error('Mappls reverse geocoding error:', error);
    return null;
  }
}
