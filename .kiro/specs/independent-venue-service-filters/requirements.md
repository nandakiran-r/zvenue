# Requirements Document

## Introduction

This feature separates the filtering system on the Zvenue home screen so that venue filters and service filters operate independently per tab. The search bar on the home screen will redirect users to the dedicated Search page (which already handles global search for both venues and services). The existing filter button (sliders icon) next to the search bar will be removed from the home screen. Instead, each tab (Venues / Services) will have its own inline filtering controls — category chips and sort options — that operate independently of each other.

## Glossary

- **Home_Screen**: The main tab screen of the Zvenue app displaying venues and services with a toggle to switch between them
- **Active_Tab**: The currently selected entity type on the Home_Screen, either "Venues" or "Services"
- **Search_Page**: The existing dedicated search tab (`app/(tabs)/search.tsx`) that handles global search across venues and services
- **Venue_Filter_State**: The set of filter selections (category, sort order) applied exclusively to venue results on the Venues tab
- **Service_Filter_State**: The set of filter selections (category, sort order) applied exclusively to service results on the Services tab
- **Category_Chip**: A horizontally scrollable chip component used to filter by category
- **Sort_Control**: An inline UI element (e.g., dropdown or chip row) for selecting sort order (price, rating)

## Requirements

### Requirement 1: Search Bar Redirects to Search Page

**User Story:** As a user, I want the home screen search bar to take me to the dedicated search page, so that I can perform a full global search across venues and services.

#### Acceptance Criteria

1. WHEN the user taps the search bar on the Home_Screen, THE Home_Screen SHALL navigate the user to the Search_Page
2. THE Home_Screen SHALL NOT perform any inline search or display search results
3. THE Home_Screen SHALL NOT display a filter button (sliders icon) next to the search bar
4. THE Home_Screen SHALL NOT contain a filter modal
5. THE Search_Page SHALL continue to function as-is, supporting global search across both venues and services with type filter chips (All, Venues, Services)

### Requirement 2: Independent Filter State Per Tab

**User Story:** As a user, I want my venue filters and service filters to be stored separately, so that changing filters on one tab does not affect the other tab.

#### Acceptance Criteria

1. THE Home_Screen SHALL maintain a separate Venue_Filter_State and Service_Filter_State, where each filter state comprises a sort order (default, price low-to-high, price high-to-low, or rating) and a selected category (all or a specific category)
2. WHEN the user applies filters on the Venues tab, THE Home_Screen SHALL store those selections in the Venue_Filter_State without modifying the Service_Filter_State
3. WHEN the user applies filters on the Services tab, THE Home_Screen SHALL store those selections in the Service_Filter_State without modifying the Venue_Filter_State
4. WHEN the user switches from the Venues tab to the Services tab, THE Home_Screen SHALL preserve the Venue_Filter_State and display the Services tab with the Service_Filter_State applied
5. WHEN the user switches from the Services tab to the Venues tab, THE Home_Screen SHALL preserve the Service_Filter_State and display the Venues tab with the Venue_Filter_State applied
6. WHEN the Home_Screen is first loaded, THE Home_Screen SHALL initialize both Venue_Filter_State and Service_Filter_State to default values of sort order "default" and selected category "all"

### Requirement 3: Venue Filtering by Category

**User Story:** As a user, I want to filter venues by category using chips on the Venues tab, so that I can narrow down venues to a specific type.

#### Acceptance Criteria

1. WHEN the Active_Tab is "Venues", THE Home_Screen SHALL display a horizontal scrollable row of Category_Chips including an "All" option followed by all venue categories returned by the categories API
2. WHEN the user taps a category chip that is not "All", THE Home_Screen SHALL display only venues whose category name matches the selected category, shown in a flat scrollable list
3. WHEN the user taps the "All" category chip, THE Home_Screen SHALL display venues from all categories grouped by category name (current default behavior)
4. THE Category_Chip row SHALL visually distinguish the selected category chip from unselected chips by applying an active style (filled background, white text)
5. IF no venues match the selected category, THEN THE Home_Screen SHALL display an empty state message indicating no venues are found for that category
6. WHEN the Home_Screen first loads with the Venues tab active, THE Category_Chip row SHALL default to the "All" category as selected

### Requirement 4: Venue Sorting by Price and Rating

**User Story:** As a user, I want to sort venues by price or rating on the Venues tab, so that I can find the best or most affordable venues.

#### Acceptance Criteria

1. WHEN the Active_Tab is "Venues", THE Home_Screen SHALL display a Sort_Control (inline chip row or dropdown) with options: "Default", "Price: Low to High", "Price: High to Low", and "Rating: Highest First"
2. WHEN the user selects "Price: Low to High", THE Home_Screen SHALL sort all displayed venue results by price_per_day in ascending order, treating null or zero price_per_day values as 0
3. WHEN the user selects "Price: High to Low", THE Home_Screen SHALL sort all displayed venue results by price_per_day in descending order, treating null or zero price_per_day values as 0
4. WHEN the user selects "Rating: Highest First", THE Home_Screen SHALL sort all displayed venue results by rating in descending order, preserving original relative order for equal ratings (stable sort)
5. WHEN the user selects "Default", THE Home_Screen SHALL display venue results in their original order as returned by the data source
6. THE Sort_Control SHALL visually indicate the currently active sort option

### Requirement 5: Service Filtering by Category

**User Story:** As a user, I want to filter services by category using chips on the Services tab, so that I can find services of a specific type.

#### Acceptance Criteria

1. WHEN the Active_Tab is "Services", THE Home_Screen SHALL display a horizontal scrollable row of Category_Chips including an "All" option followed by all active service categories sorted by sort_order
2. WHEN the user taps a service category chip that is not "All", THE Home_Screen SHALL display only services whose service_category_id matches the selected category in a flat scrollable list
3. WHEN the user taps the "All" category chip, THE Home_Screen SHALL display all services (or service category cards as the default view)
4. THE Category_Chip row SHALL visually distinguish the selected category chip from unselected chips
5. IF no services match the selected category, THEN THE Home_Screen SHALL display an empty state message
6. WHEN the Home_Screen first loads with the Services tab active, THE Category_Chip row SHALL default to the "All" category as selected

### Requirement 6: Service Sorting by Price and Rating

**User Story:** As a user, I want to sort services by price or rating on the Services tab, so that I can find the best or most affordable services.

#### Acceptance Criteria

1. WHEN the Active_Tab is "Services", THE Home_Screen SHALL display a Sort_Control with options: "Default", "Price: Low to High", "Price: High to Low", and "Rating: Highest First"
2. WHEN the user selects "Price: Low to High", THE Home_Screen SHALL sort all displayed service results by price in ascending order, treating null or zero price values as 0
3. WHEN the user selects "Price: High to Low", THE Home_Screen SHALL sort all displayed service results by price in descending order, treating null or zero price values as 0
4. WHEN the user selects "Rating: Highest First", THE Home_Screen SHALL sort service results by rating in descending order, preserving original relative order for equal ratings
5. WHEN the user selects "Default", THE Home_Screen SHALL display service results in their original order as returned by the data source
6. THE Sort_Control SHALL visually indicate the currently active sort option

### Requirement 7: Services Displayed as Flat List When Filtered

**User Story:** As a user, I want to see actual service listings on the home screen when I apply a category or sort filter, so that I can browse services without navigating away.

#### Acceptance Criteria

1. WHEN the Active_Tab is "Services" and the selected category is "All" and sort is "Default", THE Home_Screen SHALL display service category cards (current default behavior) that navigate to the service-listings page
2. WHEN the Active_Tab is "Services" and the user selects a specific category OR a non-default sort option, THE Home_Screen SHALL fetch and display individual service listings in a flat scrollable list
3. EACH service listing card SHALL display: service name, image, price, rating, city, and category name
4. WHEN the user taps a service listing card, THE Home_Screen SHALL navigate to the service-detail page with the service ID
5. IF service listings are loading, THE Home_Screen SHALL display a loading indicator
6. IF no service listings match the applied filters, THE Home_Screen SHALL display an empty state message

### Requirement 8: Filter Indicator Per Tab

**User Story:** As a user, I want to see a visual indicator when filters are active on the current tab, so that I know my results are filtered.

#### Acceptance Criteria

1. WHEN the Venue_Filter_State has any non-default value (category is not "All" OR sort is not "Default"), THE Venues tab toggle button SHALL display a small dot or badge indicating active filters
2. WHEN the Service_Filter_State has any non-default value (category is not "All" OR sort is not "Default"), THE Services tab toggle button SHALL display a small dot or badge indicating active filters
3. WHEN all filter values for a tab are at their default settings, THE corresponding tab toggle button SHALL display without any indicator
