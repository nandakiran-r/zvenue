# Implementation Plan: Admin Map Location Picker

## Overview

Add an interactive map-based location picker to the admin panel's venue and service listing forms using react-leaflet and OpenStreetMap. The implementation installs dependencies, creates a shared Nominatim service module, builds the reusable MapLocationPicker component, integrates it into all three forms (admin venues, owner venues, service listings), updates the server API to accept client-provided coordinates, and adds the required database migration for service_listings.

## Tasks

- [ ] 1. Install dependencies and set up project infrastructure
  - [ ] 1.1 Install leaflet, react-leaflet, and type definitions
    - Run `npm install leaflet react-leaflet` and `npm install -D @types/leaflet` in the `admin` directory
    - Verify packages are added to `admin/package.json`
    - _Requirements: 1.1, 1.2_

  - [ ] 1.2 Add Leaflet CSS import to the admin app
    - Import `leaflet/dist/leaflet.css` in the admin app entry point or in the MapLocationPicker component
    - Ensure map tiles render correctly with proper styling
    - _Requirements: 1.1, 1.2, 1.3_

- [ ] 2. Create Nominatim service module
  - [ ] 2.1 Implement the Nominatim client module at `admin/src/lib/nominatim.ts`
    - Export `searchAddress(query: string): Promise<NominatimSearchResult[]>` for forward geocoding
    - Export `reverseGeocode(lat: number, lng: number): Promise<NominatimReverseResult | null>` for reverse geocoding
    - Implement rate limiting with a minimum 1-second interval between API calls
    - Include proper User-Agent header for Nominatim usage policy compliance
    - Limit forward search results to 5 items via API parameter
    - _Requirements: 2.2, 5.1, 5.5_

  - [ ]* 2.2 Write unit tests for the Nominatim service module
    - Test rate limiting enforces 1-second minimum interval
    - Test forward search returns max 5 results
    - Test reverse geocoding returns null on failure
    - Test proper URL construction with query parameters
    - _Requirements: 5.5, 2.2, 2.3_

- [ ] 3. Implement MapLocationPicker component
  - [ ] 3.1 Create the MapLocationPicker component at `admin/src/components/map-location-picker.tsx`
    - Implement the `MapLocationPickerProps` interface as defined in the design
    - Render a Leaflet map with OpenStreetMap tiles at minimum 300px height, full width
    - Place a draggable marker at the provided coordinates or default center (20.5937, 78.9629 at zoom 5)
    - Handle map click events to move the marker and update coordinates
    - Handle marker drag-end events to update coordinates
    - Trigger reverse geocoding on marker position changes (click or drag)
    - Wrap the map in a React Error Boundary for graceful degradation
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 3.1, 3.2, 3.3, 4.1, 4.2, 4.3, 7.4_

  - [ ] 3.2 Implement address search functionality in MapLocationPicker
    - Add a text search input above the map
    - Debounce input with 500ms delay, minimum 3 characters before searching
    - Display up to 5 results in a dropdown with display_name
    - On result selection: move marker, center map at zoom 16, update lat/lng form fields
    - Show "No results found" when API returns empty results
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [ ] 3.3 Implement coordinate display and manual editing in MapLocationPicker
    - Display current lat/lng in read-only fields below the map
    - Add "Edit coordinates" toggle to make fields editable
    - Validate manual entries: latitude [-90, 90], longitude [-180, 180]
    - On valid manual entry confirmation: move marker and center map
    - On invalid entry: show validation error, retain previous coordinates
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [ ]* 3.4 Write property tests for MapLocationPicker
    - **Property 1: Map initialization from stored coordinates**
    - **Property 5: Marker position change updates form fields**
    - **Property 11: Manual coordinate entry moves marker**
    - **Property 12: Invalid coordinate rejection**
    - **Validates: Requirements 1.4, 3.2, 4.2, 8.3, 8.4**

  - [ ]* 3.5 Write property tests for search and geocoding behavior
    - **Property 2: Search debounce threshold**
    - **Property 3: Search results display cap**
    - **Property 4: Search result selection updates marker and form fields**
    - **Property 6: Marker position change triggers reverse geocoding**
    - **Property 7: Reverse geocoding result parsing**
    - **Property 8: Nominatim rate limiting**
    - **Validates: Requirements 2.2, 2.3, 2.4, 2.5, 3.3, 4.3, 5.1, 5.2, 5.3, 5.5**

  - [ ]* 3.6 Write unit tests for MapLocationPicker
    - Test component renders map container
    - Test default center is India (20.5937, 78.9629) at zoom 5 when no coordinates
    - Test search input is present
    - Test "No results found" shown for empty API response
    - Test marker has draggable property
    - Test text inputs remain alongside map
    - Test graceful degradation when map fails to load
    - Test "Edit coordinates" toggle makes fields editable
    - _Requirements: 1.3, 1.5, 2.1, 2.6, 4.1, 7.1, 7.4, 8.1, 8.2_

- [ ] 4. Checkpoint - Ensure component builds and tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Integrate MapLocationPicker into admin venue form
  - [ ] 5.1 Update admin venue form at `admin/src/features/venues/index.tsx`
    - Add `latitude: number | null` and `longitude: number | null` to `defaultVenueForm` state
    - Render `MapLocationPicker` in the venue create/edit dialog, passing current form values
    - Wire `onCoordinatesChange`, `onLocationChange`, `onCityChange` callbacks to update form state
    - Include `latitude` and `longitude` in the form submission payload
    - When editing an existing venue, populate lat/lng from the venue data
    - Retain existing location and city text input fields alongside the map
    - _Requirements: 1.1, 1.4, 6.1, 6.3, 7.1_

- [ ] 6. Integrate MapLocationPicker into owner venue form
  - [ ] 6.1 Update owner venue form at `admin/src/features/owner-portal/owner-venues.tsx`
    - Add `latitude: number | null` and `longitude: number | null` to form state
    - Render `MapLocationPicker` in the owner venue create/edit dialog
    - Wire callbacks to update form state
    - Include `latitude` and `longitude` in the form submission payload
    - When editing, populate lat/lng from existing venue data
    - Retain existing text input fields alongside the map
    - _Requirements: 1.1, 1.4, 6.1, 6.3, 7.1_

- [ ] 7. Integrate MapLocationPicker into service listing form
  - [ ] 7.1 Update service listing form at `admin/src/features/service-listings/index.tsx`
    - Add `latitude: number | null` and `longitude: number | null` to form state
    - Render `MapLocationPicker` in the service listing create/edit dialog
    - Wire callbacks to update form state
    - Include `latitude` and `longitude` in the form submission payload
    - When editing, populate lat/lng from existing listing data
    - Retain existing city text input field alongside the map
    - _Requirements: 1.2, 1.4, 6.2, 6.3, 7.2_

- [ ] 8. Checkpoint - Ensure form integrations build correctly
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Database migration and schema update for service_listings
  - [ ] 9.1 Add latitude and longitude columns to service_listings schema and create migration
    - Add `latitude: real('latitude')` and `longitude: real('longitude')` to the `service_listings` table in `admin/server/db/schema.js`
    - Generate a Drizzle migration that adds the two nullable REAL columns
    - _Requirements: 6.2_

- [ ] 10. Update server API to accept coordinates and skip geocoding
  - [ ] 10.1 Update venue API endpoints in `admin/server/index.js`
    - Add `latitude` and `longitude` to the `ALLOWED_VENUE_FIELDS` whitelist
    - In POST/PUT venue routes: when both `latitude` and `longitude` are valid numbers, skip the `geocodeAddress` call and use the provided coordinates directly
    - When lat/lng are not provided or invalid, fall back to existing text-based geocoding
    - _Requirements: 6.1, 6.4, 7.3_

  - [ ] 10.2 Update service listing API endpoints in `admin/server/index.js`
    - Accept `latitude` and `longitude` in POST/PUT service listing request bodies
    - Store the values in the new database columns
    - Skip geocoding when valid coordinates are provided
    - _Requirements: 6.2, 6.4, 7.3_

  - [ ]* 10.3 Write property test for server skipping geocoding
    - **Property 10: Server skips geocoding when coordinates provided**
    - **Validates: Requirements 6.4**

  - [ ]* 10.4 Write integration tests for form submission with coordinates
    - Test form submission includes lat/lng in payload when marker is placed
    - Test form submission without marker falls back to server geocoding
    - Test coordinate precision is preserved (at least 6 decimal places)
    - **Property 9: Coordinate precision preservation**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 7.3**

- [ ] 11. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The `venues` table already has `latitude` and `longitude` columns — no migration needed for venues
- The `service_listings` table requires a migration to add the two new columns
- Leaflet CSS must be imported for proper map rendering
- The Nominatim rate limiter is critical for compliance with OSM usage policy

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "2.1"] },
    { "id": 2, "tasks": ["2.2", "3.1"] },
    { "id": 3, "tasks": ["3.2", "3.3"] },
    { "id": 4, "tasks": ["3.4", "3.5", "3.6"] },
    { "id": 5, "tasks": ["5.1", "6.1", "7.1", "9.1"] },
    { "id": 6, "tasks": ["10.1", "10.2"] },
    { "id": 7, "tasks": ["10.3", "10.4"] }
  ]
}
```
