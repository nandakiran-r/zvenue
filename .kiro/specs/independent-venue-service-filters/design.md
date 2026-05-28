# Technical Design Document

## Overview

This design refactors the Zvenue home screen (`app/(tabs)/home.tsx`) to:
1. Remove the inline search + filter modal, replacing the search bar with a tap-to-navigate control that opens the existing Search page
2. Introduce independent, per-tab filter state (category + sort) for Venues and Services
3. Add inline sort chips below the category row for each tab
4. Display service listings as a flat list when a category or sort filter is applied on the Services tab

The approach is low-risk: it removes complexity (filter modal, inline search) and reuses existing API functions (`fetchVenues`, `fetchServiceListings`, `fetchCategories`, `fetchServiceCategories`).

## Architecture

The home screen is a single-file component (`app/(tabs)/home.tsx`) that manages all state locally via React `useState` and `useMemo`. No new files, stores, or contexts are introduced. The refactor replaces the shared filter modal with per-tab inline controls and delegates search to the existing Search page tab.

Key architectural decisions:
- **Client-side filtering for venues:** All venue data is already fetched and grouped on mount. Filtering and sorting is done via `useMemo` over the existing `venuesByCategory` state — no additional API calls needed.
- **Server-side + client-side for services:** Service listings are fetched from the API when a filter is applied (using existing `fetchServiceListings`), then sorted client-side. When filters are at defaults, the original category card navigation is preserved.
- **No shared state:** Each tab's filter state is an independent `useState` object. No Zustand store or context is needed since filters are local to this screen.

## Components and Interfaces

### Component Hierarchy (Home Screen)

```
HomeScreen
├── Header (location picker + notifications)
├── SearchBarTouchable → navigates to /(tabs)/search
├── TabToggle (Venues | Services) + filter indicator dots
├── CategoryChipRow (per-tab, independent)
├── SortChipRow (per-tab, independent)
└── ContentArea
    ├── [Venues tab] VenueCategoryGroups | VenueFlatList (when filtered)
    └── [Services tab] ServiceCategoryCards | ServiceFlatList (when filtered)
```

### Interfaces

```typescript
// Per-tab filter state interface
interface TabFilterState {
  selectedCategory: string; // "all" or category id/name
  sortBy: 'default' | 'price_low' | 'price_high' | 'rating';
}

// Sort option definition
interface SortOption {
  key: 'default' | 'price_low' | 'price_high' | 'rating';
  label: string;
}
```

### SearchBarTouchable Component

Replaces the current TextInput + filter button:

```typescript
<TouchableOpacity
  style={styles.searchBarTouchable}
  onPress={() => router.push("/(tabs)/search")}
  activeOpacity={0.7}
>
  <Search size={18} color={Colors.textSecondary} />
  <Text style={styles.searchPlaceholder}>Search venues & services</Text>
</TouchableOpacity>
```

### SortChipRow Component

Inline horizontal chip row for sort options:

```typescript
const SORT_OPTIONS: SortOption[] = [
  { key: 'default', label: 'Default' },
  { key: 'price_low', label: 'Price ↑' },
  { key: 'price_high', label: 'Price ↓' },
  { key: 'rating', label: 'Top Rated' },
];

<ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sortRow}>
  {SORT_OPTIONS.map(option => (
    <TouchableOpacity
      key={option.key}
      style={[styles.sortChip, currentFilters.sortBy === option.key && styles.sortChipActive]}
      onPress={() => updateFilters({ sortBy: option.key })}
    >
      <Text style={[styles.sortChipText, currentFilters.sortBy === option.key && styles.sortChipTextActive]}>
        {option.label}
      </Text>
    </TouchableOpacity>
  ))}
</ScrollView>
```

### Filter Indicator Dot

```typescript
const venueHasFilters = venueFilters.selectedCategory !== 'all' || venueFilters.sortBy !== 'default';
const serviceHasFilters = serviceFilters.selectedCategory !== 'all' || serviceFilters.sortBy !== 'default';

// Rendered as absolute-positioned dot on tab toggle button
{venueHasFilters && <View style={styles.filterDot} />}
```

## Data Models

### State Variables (HomeScreen)

```typescript
// Replaces old: selectedCategory, filterModalVisible, filterType, sortBy,
//               searchQuery, isSearching, searchResults, searchLoading, searchTimeout

const [venueFilters, setVenueFilters] = useState<TabFilterState>({
  selectedCategory: 'all',
  sortBy: 'default',
});

const [serviceFilters, setServiceFilters] = useState<TabFilterState>({
  selectedCategory: 'all',
  sortBy: 'default',
});

// New: service listings for inline display when filtered
const [serviceListings, setServiceListings] = useState<DbServiceListing[]>([]);
const [serviceListingsLoading, setServiceListingsLoading] = useState(false);

// Existing (unchanged):
const [activeTab, setActiveTab] = useState<'venues' | 'services'>('venues');
const [categories, setCategories] = useState<DbCategory[]>([]);
const [venuesByCategory, setVenuesByCategory] = useState<Record<string, DbVenue[]>>({});
const [serviceCategories, setServiceCategories] = useState<DbServiceCategory[]>([]);
```

### Data Flow

```
┌─────────────────────────────────────────────────────────┐
│                    HomeScreen                             │
│                                                          │
│  ┌──────────────┐     ┌──────────────────┐              │
│  │ venueFilters │     │ serviceFilters   │              │
│  │ {category,   │     │ {category,       │              │
│  │  sortBy}     │     │  sortBy}         │              │
│  └──────┬───────┘     └────────┬─────────┘              │
│         │                      │                         │
│         ▼                      ▼                         │
│  ┌──────────────┐     ┌──────────────────┐              │
│  │ useMemo:     │     │ useEffect:       │              │
│  │ filter+sort  │     │ fetchService     │              │
│  │ venues       │     │ Listings         │              │
│  └──────┬───────┘     └────────┬─────────┘              │
│         │                      │                         │
│         ▼                      ▼                         │
│  ┌──────────────┐     ┌──────────────────┐              │
│  │ VenueList    │     │ ServiceList /    │              │
│  │ (grouped or  │     │ CategoryCards    │              │
│  │  flat)       │     │                  │              │
│  └──────────────┘     └──────────────────┘              │
└─────────────────────────────────────────────────────────┘
```

### Venue Filtering Logic (Client-Side)

```typescript
const getFilteredVenues = useMemo(() => {
  let allVenues = Object.values(venuesByCategory).flat();

  if (venueFilters.selectedCategory !== 'all') {
    allVenues = allVenues.filter(v => v.category?.name === venueFilters.selectedCategory);
  }

  if (venueFilters.sortBy === 'price_low') {
    allVenues.sort((a, b) => (a.price_per_day ?? 0) - (b.price_per_day ?? 0));
  } else if (venueFilters.sortBy === 'price_high') {
    allVenues.sort((a, b) => (b.price_per_day ?? 0) - (a.price_per_day ?? 0));
  } else if (venueFilters.sortBy === 'rating') {
    allVenues.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  }

  return allVenues;
}, [venuesByCategory, venueFilters]);
```

### Service Listing Fetch Logic

```typescript
useEffect(() => {
  const isFiltered = serviceFilters.selectedCategory !== 'all' || serviceFilters.sortBy !== 'default';
  if (activeTab === 'services' && isFiltered) {
    loadServiceListings();
  }
}, [serviceFilters, activeTab]);

const loadServiceListings = async () => {
  setServiceListingsLoading(true);
  try {
    const params: { category_id?: string; limit: number } = { limit: 50 };
    if (serviceFilters.selectedCategory !== 'all') {
      params.category_id = serviceFilters.selectedCategory;
    }
    const data = await fetchServiceListings(params);
    let sorted = [...data];
    if (serviceFilters.sortBy === 'price_low') sorted.sort((a, b) => a.price - b.price);
    else if (serviceFilters.sortBy === 'price_high') sorted.sort((a, b) => b.price - a.price);
    else if (serviceFilters.sortBy === 'rating') sorted.sort((a, b) => b.rating - a.rating);
    setServiceListings(sorted);
  } catch (err) {
    console.error("Failed to load service listings:", err);
  } finally {
    setServiceListingsLoading(false);
  }
};
```

## Error Handling

| Scenario | Handling |
|----------|----------|
| Service listings fetch fails | Log error, show empty state with "Failed to load services" message |
| Venue data is empty for selected category | Show "No venues found for this category" empty state |
| Service data is empty for selected category | Show "No services found for this category" empty state |
| Network timeout on service fetch | Loading indicator shown; user can switch category to retry |
| Categories API fails on initial load | Existing error handling in `loadData()` catches this; category chips won't render |

## Correctness Properties

### Property 1: State Isolation
Modifying `venueFilters` MUST NOT affect `serviceFilters` and vice versa. Each state setter only updates its own object.
**Validates: Requirements 2.2, 2.3**

### Property 2: Idempotent Rendering
Given the same `venueFilters` + `venuesByCategory`, `getFilteredVenues` MUST always return the same result (enforced by `useMemo` dependencies).
**Validates: Requirements 3.2, 4.2, 4.3, 4.4**

### Property 3: Default State Equivalence
When both filter states are at defaults (`{selectedCategory: 'all', sortBy: 'default'}`), the home screen MUST render identically to the current production behavior (grouped venues, service category cards).
**Validates: Requirements 3.3, 5.3, 7.1**

### Property 4: Tab Switch Preservation
Switching `activeTab` MUST NOT trigger any state reset on either filter state.
**Validates: Requirements 2.4, 2.5**

### Property 5: Sort Stability
When sorting by rating and two items have equal ratings, their relative order MUST be preserved (JavaScript's `Array.sort` is stable in modern engines).
**Validates: Requirements 4.4, 6.4**

## Files Modified

| File | Change |
|------|--------|
| `app/(tabs)/home.tsx` | Major refactor: remove search/filter modal, add per-tab filter state, sort chips, service listing fetch, filter indicators |
| `lib/serviceApi.ts` | No changes — `fetchServiceListings` already supports `category_id` param |
| `lib/api.ts` | No changes — `fetchVenues` already supports `categoryName` filter |

## Testing Strategy

- Verify search bar tap navigates to search page (no inline search behavior)
- Verify venue category chips filter venues in-place without navigation
- Verify venue sort chips sort correctly (price asc/desc, rating)
- Verify service category chips fetch and display listings inline
- Verify service sort chips sort correctly
- Verify switching tabs preserves each tab's filter state independently
- Verify filter indicator dots appear/disappear correctly on tab toggles
- Verify "All" + "Default" returns to original grouped/card view for both tabs
- Verify "See More" links still navigate to category-venues page
- Verify empty states display when no results match filters

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Service listings fetch without category could return too many results | Limit to 50 items; can add pagination later |
| Sorting is client-side, may be slow for large datasets | Venue data is already loaded; service data is capped at 50 |
| Removing inline search may confuse users who used it | Search bar visual remains identical; tap behavior is intuitive |
| Category chip behavior change (no longer navigates for venues) | "See More" links per category section still navigate to full category page |
