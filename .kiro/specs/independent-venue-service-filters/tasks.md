# Implementation Plan: Independent Venue & Service Filters

## Overview

This plan implements independent per-tab filtering on the Zvenue home screen. It removes the shared filter modal and inline search (delegating search to the existing Search page), then adds per-tab category chips and sort controls that operate independently for Venues and Services.

## Tasks

- [ ] 1. Remove inline search, filter button, and filter modal from home screen
  - Remove `searchQuery`, `isSearching`, `searchResults`, `searchLoading`, `searchTimeout` state variables
  - Remove `filterModalVisible`, `filterType`, `sortBy` state variables
  - Remove `handleSearchChange`, `sortResults`, `clearSearch`, `applyFilters`, `applySortToBrowseView`, `clearFilters` functions
  - Remove the `useEffect` that re-searches when filter/sort changes
  - Remove the `useEffect` that applies sort on browse view when `sortBy` changes
  - Remove the filter `<Modal>` component and all its contents
  - Remove the search results rendering block (the `isSearching ? (...)` ternary)
  - Remove unused imports: `searchAll` from `@/lib/serviceApi`, `SearchResults` from `@/lib/serviceTypes`, `Modal`
  - Replace the `searchRow` (TextInput + filter button) with a `TouchableOpacity` styled as a search bar that calls `router.push("/(tabs)/search")` on press
  - Verify the home screen renders without errors after removal

- [ ] 2. Add independent per-tab filter state
  - Define `TabFilterState` interface with `selectedCategory: string` and `sortBy: 'default' | 'price_low' | 'price_high' | 'rating'`
  - Add `venueFilters` state initialized to `{ selectedCategory: 'all', sortBy: 'default' }`
  - Add `serviceFilters` state initialized to `{ selectedCategory: 'all', sortBy: 'default' }`
  - Remove the old `selectedCategory` state variable (replaced by `venueFilters.selectedCategory`)
  - Verify that switching tabs does not reset either filter state

- [ ] 3. Refactor venue category chips to filter in-place
  - Update venue category chip `onPress`: update `venueFilters.selectedCategory` instead of navigating to `/category-venues`
  - Apply active styling to the chip matching `venueFilters.selectedCategory`
  - Add `getFilteredVenues` useMemo that flattens `venuesByCategory`, filters by category, and sorts by `venueFilters.sortBy`
  - When `venueFilters` is all-default, render existing grouped-by-category horizontal scroll view
  - When any venue filter is non-default, render a flat vertical list of venue cards
  - Show empty state when `getFilteredVenues` returns empty array
  - Keep "See More" button per category section navigating to `/category-venues`

- [ ] 4. Add venue sort chip row
  - Define `SORT_OPTIONS` constant array with default, price_low, price_high, rating options
  - Render horizontal ScrollView of sort chips below venue category chips when `activeTab === 'venues'`
  - Each chip updates `venueFilters.sortBy` on press
  - Apply active styling to selected sort chip
  - Add styles: `sortRow`, `sortChip`, `sortChipActive`, `sortChipText`, `sortChipTextActive`

- [ ] 5. Refactor service category chips to filter in-place
  - Update service category chip `onPress`: update `serviceFilters.selectedCategory` instead of navigating to `/service-listings`
  - Add "All" chip at beginning of service category chip row
  - Apply active styling to chip matching `serviceFilters.selectedCategory`
  - Add `serviceListings` state (DbServiceListing[]) and `serviceListingsLoading` state
  - Add useEffect to fetch service listings via `fetchServiceListings({ category_id, limit: 50 })` when filters are non-default
  - Add `getSortedServiceListings` useMemo that sorts by `serviceFilters.sortBy`
  - When `serviceFilters` is all-default, render existing service category cards view
  - When any service filter is non-default, render flat list of service listing cards (image, name, price, rating, city, category)
  - Tapping a service card navigates to `/service-detail` with service ID
  - Show loading indicator while fetching
  - Show empty state when no listings match

- [ ] 6. Add service sort chip row
  - Render same SORT_OPTIONS sort chip row below service category chips when `activeTab === 'services'`
  - Each chip updates `serviceFilters.sortBy` on press
  - Apply active styling to selected sort chip
  - Reuse styles from Task 4

- [ ] 7. Add filter indicator dots on tab toggle buttons
  - Compute `venueHasFilters` and `serviceHasFilters` booleans
  - Render small colored dot (6px, primary color) on Venues toggle when `venueHasFilters` is true
  - Render small colored dot on Services toggle when `serviceHasFilters` is true
  - Add `filterDot` style (position absolute, top-right)
  - Verify dots appear/disappear when filters change

- [ ] 8. Final cleanup and verification
  - Remove unused style definitions for old filter modal and inline search
  - Remove unused imports (SlidersHorizontal, TextInput if unused, etc.)
  - Add `fetchServiceListings` and `DbServiceListing` to imports
  - Add `useMemo` to React imports
  - Verify TypeScript compilation passes
  - Verify home screen loads with default state (grouped venues, service category cards)
  - Verify search bar tap navigates to search page
  - Verify venue category + sort filtering works independently
  - Verify service category + sort filtering works independently
  - Verify switching tabs preserves filter state
  - Verify filter indicator dots reflect correct state

## Task Dependency Graph

```json
{
  "waves": [
    {"wave": 1, "tasks": [1]},
    {"wave": 2, "tasks": [2]},
    {"wave": 3, "tasks": [3, 5, 7]},
    {"wave": 4, "tasks": [4, 6]},
    {"wave": 5, "tasks": [8]}
  ]
}
```

Tasks 3, 5, and 7 can be done in parallel after Task 2. Tasks 4 and 6 depend on 3 and 5 respectively. Task 8 is the final step after all others.

## Notes

- No backend changes required. `fetchServiceListings` already supports `category_id` filtering and `fetchVenues` data is already loaded and grouped client-side.
- The service listings fetch is capped at 50 items to avoid performance issues. Pagination can be added later if needed.
- The "See More" links on venue category sections still navigate to the full category page, preserving that navigation path.
- The existing Search page (`app/(tabs)/search.tsx`) already handles global search with type filter chips (All/Venues/Services) — no changes needed there.
