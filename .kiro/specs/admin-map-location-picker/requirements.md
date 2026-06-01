# Requirements Document

## Introduction

The admin panel currently relies on text-based address entry (location + city fields) with server-side auto-geocoding via OpenStreetMap Nominatim to derive latitude/longitude coordinates. This approach is unreliable — vague or ambiguous addresses produce incorrect coordinates, which directly impacts the mobile app's map display and distance-based venue sorting.

This feature adds a visual map-based location picker to the admin panel's venue and service listing create/edit forms. Admins and owners can search for an address, see it on an interactive map, and click or drag a pin to set the exact location. The captured coordinates are stored directly, eliminating geocoding inaccuracies.

## Glossary

- **Map_Picker**: The interactive map component embedded in the admin panel forms that displays a Leaflet/OpenStreetMap tile layer, a draggable marker pin, and an address search input
- **Admin_Panel**: The React-based web application used by admins and venue owners to manage venues and service listings
- **Venue_Form**: The dialog form used to create or edit a venue in the admin panel
- **Service_Listing_Form**: The dialog form used to create or edit a service listing in the admin panel
- **Marker_Pin**: The draggable map marker that indicates the selected geographic location
- **Nominatim_API**: The OpenStreetMap geocoding/reverse-geocoding service already used by the server
- **Reverse_Geocoding**: The process of converting latitude/longitude coordinates into a human-readable address
- **Forward_Geocoding**: The process of converting a text address into latitude/longitude coordinates (address search)
- **Coordinates**: A pair of latitude (decimal degrees, -90 to 90) and longitude (decimal degrees, -180 to 180) values

## Requirements

### Requirement 1: Map Picker Component Display

**User Story:** As an admin, I want to see an interactive map in the venue/service listing form, so that I can visually select the exact location.

#### Acceptance Criteria

1. WHEN the Venue_Form is opened for create or edit, THE Map_Picker SHALL render an interactive OpenStreetMap tile layer within the form
2. WHEN the Service_Listing_Form is opened for create or edit, THE Map_Picker SHALL render an interactive OpenStreetMap tile layer within the form
3. THE Map_Picker SHALL display at a minimum height of 300 pixels and occupy the full width of the form content area
4. WHEN the form is opened for editing an existing venue with stored latitude and longitude, THE Map_Picker SHALL center the map on the stored coordinates and place the Marker_Pin at that position
5. WHEN the form is opened for creating a new venue with no stored coordinates, THE Map_Picker SHALL center the map on a default location (India center: 20.5937, 78.9629) at zoom level 5

### Requirement 2: Address Search with Map Update

**User Story:** As an admin, I want to search for an address and see the result on the map, so that I can quickly navigate to the correct area before fine-tuning the pin.

#### Acceptance Criteria

1. THE Map_Picker SHALL include a text search input field positioned above or overlaid on the map
2. WHEN the admin types at least 3 characters into the search input and pauses for 500 milliseconds, THE Map_Picker SHALL query the Nominatim_API for matching addresses
3. WHEN the Nominatim_API returns search results, THE Map_Picker SHALL display up to 5 results in a dropdown list showing the display name of each result
4. WHEN the admin selects a result from the dropdown, THE Map_Picker SHALL move the Marker_Pin to the selected coordinates and center the map on that location at zoom level 16
5. WHEN the admin selects a result from the dropdown, THE Map_Picker SHALL populate the latitude and longitude form fields with the coordinates from the selected result
6. IF the Nominatim_API returns no results, THEN THE Map_Picker SHALL display a "No results found" message in the dropdown area

### Requirement 3: Pin Placement via Map Click

**User Story:** As an admin, I want to click on the map to place the location pin, so that I can set the exact position even if the address search result is slightly off.

#### Acceptance Criteria

1. WHEN the admin clicks on any point on the map, THE Map_Picker SHALL move the Marker_Pin to the clicked coordinates
2. WHEN the Marker_Pin is moved via map click, THE Map_Picker SHALL update the latitude and longitude form fields with the new coordinates
3. WHEN the Marker_Pin is moved via map click, THE Map_Picker SHALL trigger Reverse_Geocoding to update the location text field with the address corresponding to the new coordinates

### Requirement 4: Pin Drag for Fine-Tuning

**User Story:** As an admin, I want to drag the map pin to fine-tune the exact location, so that I can correct minor positioning errors.

#### Acceptance Criteria

1. THE Marker_Pin SHALL be draggable by the admin
2. WHEN the admin finishes dragging the Marker_Pin to a new position, THE Map_Picker SHALL update the latitude and longitude form fields with the new coordinates
3. WHEN the admin finishes dragging the Marker_Pin to a new position, THE Map_Picker SHALL trigger Reverse_Geocoding to update the location text field with the address corresponding to the new coordinates

### Requirement 5: Reverse Geocoding for Address Auto-Fill

**User Story:** As an admin, I want the address fields to auto-fill when I place a pin on the map, so that I do not have to manually type the address after selecting a location visually.

#### Acceptance Criteria

1. WHEN Reverse_Geocoding is triggered by pin placement or drag, THE Map_Picker SHALL call the Nominatim_API reverse endpoint with the current Marker_Pin coordinates
2. WHEN the Nominatim_API reverse endpoint returns a result, THE Map_Picker SHALL populate the location form field with the returned street address
3. WHEN the Nominatim_API reverse endpoint returns a result containing a city or town name, THE Map_Picker SHALL populate the city form field with that value
4. IF the Nominatim_API reverse endpoint fails or returns no result, THEN THE Map_Picker SHALL retain the existing location and city field values without clearing them
5. THE Map_Picker SHALL enforce a minimum interval of 1 second between consecutive Nominatim_API requests to comply with the Nominatim usage policy

### Requirement 6: Coordinate Storage in Form Submission

**User Story:** As an admin, I want the exact latitude and longitude from the map to be saved with the venue, so that the mobile app displays the correct map pin and calculates accurate distances.

#### Acceptance Criteria

1. WHEN the admin submits the Venue_Form with a Marker_Pin placed on the map, THE Admin_Panel SHALL include the latitude and longitude values from the Marker_Pin in the form submission payload
2. WHEN the admin submits the Service_Listing_Form with a Marker_Pin placed on the map, THE Admin_Panel SHALL include the latitude and longitude values from the Marker_Pin in the form submission payload
3. THE Admin_Panel SHALL store latitude and longitude as decimal numbers with at least 6 decimal places of precision
4. WHEN the form is submitted with latitude and longitude from the Map_Picker, THE Admin_Panel SHALL skip server-side auto-geocoding for that submission

### Requirement 7: Backward Compatibility with Text-Only Entry

**User Story:** As an admin, I want the option to still enter a text address without using the map, so that the system remains functional if the map fails to load or I prefer text entry.

#### Acceptance Criteria

1. THE Venue_Form SHALL retain the existing location and city text input fields alongside the Map_Picker
2. THE Service_Listing_Form SHALL retain the existing city text input field alongside the Map_Picker
3. WHEN the admin submits the form without placing a Marker_Pin (latitude and longitude are empty), THE Admin_Panel SHALL fall back to server-side geocoding using the text location and city fields
4. IF the Map_Picker fails to load due to a network error or library failure, THEN THE Admin_Panel SHALL display the text input fields without the map and allow form submission using text-only entry

### Requirement 8: Coordinate Display and Manual Override

**User Story:** As an admin, I want to see the current latitude and longitude values and optionally edit them manually, so that I can verify or correct coordinates from an external source.

#### Acceptance Criteria

1. THE Map_Picker SHALL display the current latitude and longitude values in read-only text fields below the map
2. WHEN the admin clicks an "Edit coordinates" toggle, THE Map_Picker SHALL make the latitude and longitude fields editable
3. WHEN the admin manually enters valid latitude (-90 to 90) and longitude (-180 to 180) values and confirms, THE Map_Picker SHALL move the Marker_Pin to the entered coordinates and center the map on that location
4. IF the admin enters latitude or longitude values outside the valid range, THEN THE Map_Picker SHALL display a validation error and retain the previous valid coordinates
