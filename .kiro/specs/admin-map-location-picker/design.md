# Design Document: Admin Map Location Picker

## Overview

This feature adds an interactive map-based location picker (`MapLocationPicker`) to the admin panel's venue and service listing forms. It uses **react-leaflet** with OpenStreetMap tiles (free, no API key) and the existing **Nominatim API** for forward/reverse geocoding.

The component allows admins and venue owners to:
- Search for an address and see it on the map (forward geocoding)
- Click or drag a pin to set exact coordinates (reverse geocoding auto-fills address)
- Manually enter/edit coordinates
- Fall back to text-only entry if the map fails to load

The server is updated to accept client-provided lat/lng and skip auto-geocoding when coordinates are already present.

## Architecture

```mermaid
graph TD
    subgraph Admin Panel (React)
        VF[Venue Form] --> MLP[MapLocationPicker]
        OF[Owner Venue Form] --> MLP
        SLF[Service Listing Form] --> MLP
        MLP --> LC[Leaflet/react-leaflet]
        MLP --> NS[Nominatim Service Module]
    end

    subgraph Server (Fastify)
        API[POST/PUT /api/venues] --> GC{lat/lng provided?}
        GC -->|Yes| SKIP[Skip geocoding, use provided coords]
        GC -->|No| AUTO[Auto-geocode from text fields]
        API2[POST/PUT /api/service-listings] --> GC2{lat/lng provided?}
        GC2 -->|Yes| SKIP2[Skip geocoding]
        GC2 -->|No| AUTO2[Auto-geocode from text fields]
    end

    subgraph External
        OSM[OpenStreetMap Tiles]
        NOM[Nominatim API]
    end

    LC --> OSM
    NS --> NOM
```

### Key Design Decisions

1. **react-leaflet over Google Maps / Mapbox**: Free, no API key, already aligned with the server's Nominatim usage. No vendor lock-in.
2. **Shared component**: A single `MapLocationPicker` component is reused across all three forms (venue, owner venue, service listing) via props.
3. **Client-side Nominatim calls**: The search/reverse-geocoding calls happen in the browser. The existing server-side `geocode.js` module remains as a fallback for text-only submissions.
4. **Graceful degradation**: If Leaflet fails to load (network issue, CSP block), the form still works with text inputs only.
5. **Database migration for service_listings**: Add `latitude` and `longitude` columns to the `service_listings` table to match the `venues` table.

## Components and Interfaces

### MapLocationPicker Component

**File**: `admin/src/components/map-location-picker.tsx`

```typescript
interface MapLocationPickerProps {
  /** Current latitude value (null if not set) */
  latitude: number | null;
  /** Current longitude value (null if not set) */
  longitude: number | null;
  /** Current location text (street address) */
  location: string;
  /** Current city text */
  city: string;
  /** Callback when coordinates change */
  onCoordinatesChange: (lat: number | null, lng: number | null) => void;
  /** Callback when location text changes (from reverse geocoding) */
  onLocationChange: (location: string) => void;
  /** Callback when city text changes (from reverse geocoding) */
  onCityChange: (city: string) => void;
  /** Whether the component is disabled */
  disabled?: boolean;
}
```

**Internal State**:
- `searchQuery: string` — current search input text
- `searchResults: NominatimResult[]` — forward geocoding results
- `isSearching: boolean` — loading state for search
- `showDropdown: boolean` — whether to show results dropdown
- `editingCoords: boolean` — whether manual coordinate editing is active
- `mapError: boolean` — whether the map failed to load

### Nominatim Service Module

**File**: `admin/src/lib/nominatim.ts`

```typescript
interface NominatimSearchResult {
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

interface NominatimReverseResult {
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

/** Forward geocode: search for addresses */
function searchAddress(query: string): Promise<NominatimSearchResult[]>;

/** Reverse geocode: get address from coordinates */
function reverseGeocode(lat: number, lng: number): Promise<NominatimReverseResult | null>;
```

**Rate Limiting**: The module enforces a minimum 1-second interval between any Nominatim API calls using a timestamp-based throttle (matching the server-side pattern in `geocode.js`).

### Integration Points

| Form | File | Changes |
|------|------|---------|
| Admin Venue Form | `admin/src/features/venues/index.tsx` | Add `latitude`, `longitude` to form state; render `MapLocationPicker`; include coords in payload |
| Owner Venue Form | `admin/src/features/owner-portal/owner-venues.tsx` | Same as above |
| Service Listing Form | `admin/src/features/service-listings/index.tsx` | Add `latitude`, `longitude` to form state; render `MapLocationPicker`; include coords in payload |

### Server API Changes

**Venue endpoints** (`POST /api/venues`, `PUT /api/venues/:id`, owner venue routes):
- Accept `latitude` and `longitude` in request body
- Add `latitude` and `longitude` to the `ALLOWED_VENUE_FIELDS` whitelist
- Skip geocoding when both `latitude` and `longitude` are provided as valid numbers

**Service listing endpoints** (`POST /api/service-listings`, `PUT /api/service-listings/:id`):
- Accept `latitude` and `longitude` in request body
- Store in the new database columns

## Data Models

### Venues Table (existing — no changes)

| Column | Type | Notes |
|--------|------|-------|
| latitude | real | Already exists |
| longitude | real | Already exists |

### Service Listings Table (migration required)

| Column | Type | Notes |
|--------|------|-------|
| latitude | real | **NEW** — nullable, default null |
| longitude | real | **NEW** — nullable, default null |

**Migration SQL**:
```sql
ALTER TABLE service_listings ADD COLUMN latitude REAL;
ALTER TABLE service_listings ADD COLUMN longitude REAL;
```

**Schema update** in `admin/server/db/schema.js`:
```javascript
// Add to service_listings table definition:
latitude: real('latitude'),
longitude: real('longitude'),
```

### Form State Shape

```typescript
// Added to venue form state
interface VenueFormWithCoords {
  // ... existing fields
  latitude: number | null;
  longitude: number | null;
}

// Added to service listing form state
interface ServiceListingFormWithCoords {
  // ... existing fields
  latitude: number | null;
  longitude: number | null;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Map initialization from stored coordinates

*For any* valid latitude (-90 to 90) and longitude (-180 to 180) pair passed as props, the MapLocationPicker SHALL place the marker at exactly those coordinates and center the map view on them.

**Validates: Requirements 1.4**

### Property 2: Search debounce threshold

*For any* string typed into the search input, the Nominatim API SHALL be called if and only if the string length is >= 3 characters and at least 500ms have elapsed since the last keystroke.

**Validates: Requirements 2.2**

### Property 3: Search results display cap

*For any* Nominatim API response containing N results (where N >= 0), the dropdown SHALL display exactly min(N, 5) items, each showing the result's display_name.

**Validates: Requirements 2.3**

### Property 4: Search result selection updates marker and form fields

*For any* search result selected from the dropdown, the marker position and the latitude/longitude form field values SHALL equal the coordinates from that selected result.

**Validates: Requirements 2.4, 2.5**

### Property 5: Marker position change updates form fields

*For any* marker position change (via map click or drag-end), the latitude and longitude form field values SHALL equal the new marker coordinates.

**Validates: Requirements 3.1, 3.2, 4.2**

### Property 6: Marker position change triggers reverse geocoding

*For any* marker position change (via map click or drag-end), the Nominatim reverse geocoding endpoint SHALL be called with the new marker coordinates.

**Validates: Requirements 3.3, 4.3, 5.1**

### Property 7: Reverse geocoding result parsing

*For any* Nominatim reverse geocoding response containing an address object, the location field SHALL be populated with the street address, and the city field SHALL be populated with the value from the first available field in order: `city`, `town`, `village`.

**Validates: Requirements 5.2, 5.3**

### Property 8: Nominatim rate limiting

*For any* sequence of rapid coordinate changes triggering reverse geocoding, the actual API calls SHALL be spaced at least 1000ms apart.

**Validates: Requirements 5.5**

### Property 9: Coordinate precision preservation

*For any* latitude and longitude values with 6 or more decimal places set via the MapLocationPicker, the values included in the form submission payload SHALL preserve at least 6 decimal places of precision.

**Validates: Requirements 6.3**

### Property 10: Server skips geocoding when coordinates provided

*For any* venue or service listing create/update request that includes valid numeric latitude and longitude values, the server SHALL NOT call the geocodeAddress function.

**Validates: Requirements 6.4**

### Property 11: Manual coordinate entry moves marker

*For any* manually entered latitude (-90 to 90) and longitude (-180 to 180) values confirmed by the user, the marker SHALL move to those exact coordinates.

**Validates: Requirements 8.3**

### Property 12: Invalid coordinate rejection

*For any* latitude value outside [-90, 90] or longitude value outside [-180, 180] entered manually, the component SHALL display a validation error and the marker SHALL remain at its previous valid position.

**Validates: Requirements 8.4**

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Leaflet/react-leaflet fails to load | Catch error in ErrorBoundary wrapper; set `mapError=true`; render text-only inputs without map |
| Nominatim forward search returns error/timeout | Show "Search failed" message in dropdown; retain current map state |
| Nominatim reverse geocoding fails | Retain existing location/city field values; log warning to console |
| Nominatim returns no results for search | Show "No results found" in dropdown |
| Invalid coordinates entered manually | Show inline validation error; do not update marker or form fields |
| Network offline during map tile load | Leaflet shows grey tiles; map interaction still works if tiles were cached |
| Server receives invalid lat/lng in payload | Ignore invalid values; fall back to text-based geocoding |

### Error Boundary

The `MapLocationPicker` is wrapped in a React Error Boundary that catches rendering errors from Leaflet and falls back to a message: "Map unavailable — enter address manually."

## Testing Strategy

### Property-Based Tests (using fast-check)

The admin project uses **Vitest** as its test runner. Property-based tests will use **fast-check** (the standard PBT library for TypeScript/JavaScript).

**Configuration**:
- Minimum 100 iterations per property test
- Each test tagged with: `Feature: admin-map-location-picker, Property {N}: {description}`

**Test file**: `admin/src/components/__tests__/map-location-picker.property.test.ts`

Properties to implement:
1. Map initialization from coordinates (Property 1)
2. Search debounce threshold (Property 2)
3. Search results display cap (Property 3)
4. Search result selection (Property 4)
5. Marker position change updates fields (Property 5)
6. Marker position change triggers reverse geocoding (Property 6)
7. Reverse geocoding result parsing (Property 7)
8. Rate limiting (Property 8)
9. Coordinate precision (Property 9)
10. Server skips geocoding (Property 10)
11. Manual coordinate entry (Property 11)
12. Invalid coordinate rejection (Property 12)

### Unit Tests (example-based)

**Test file**: `admin/src/components/__tests__/map-location-picker.test.tsx`

- Component renders map container in venue form
- Component renders map container in service listing form
- Default center is India (20.5937, 78.9629) at zoom 5 when no coordinates
- Search input is present
- "No results found" shown for empty API response
- Marker has draggable property
- Text inputs remain alongside map
- Graceful degradation when map fails to load
- "Edit coordinates" toggle makes fields editable

### Integration Tests

**Test file**: `admin/src/features/__tests__/venue-form-map.integration.test.tsx`

- Form submission includes lat/lng in payload when marker is placed
- Form submission without marker falls back to server geocoding
- Server endpoint skips geocoding when lat/lng provided (server-side test)

### Dependencies to Install

```bash
npm install leaflet react-leaflet fast-check
npm install -D @types/leaflet
```

### Leaflet CSS

Import Leaflet CSS in the component or in the app entry point:
```typescript
import 'leaflet/dist/leaflet.css';
```
