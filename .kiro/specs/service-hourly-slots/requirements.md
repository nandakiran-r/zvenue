# Requirements Document

## Introduction

This feature replaces the fixed 3-session booking system (Morning/Afternoon/Full Day) for services with a flexible 30-minute slot-based booking system. Service providers configure their operating hours and maximum booking duration per listing. Users select consecutive 30-minute time slots on their chosen date. Owners can also block specific time ranges for breaks or personal appointments.

## Glossary

- **Time_Slot**: A 30-minute block of time (e.g., 10:00–10:30) that can be selected for booking
- **Slot_Grid**: The UI component displaying all available time slots for a selected date
- **Opening_Time**: The earliest time a service is available for booking on any day (set by owner)
- **Closing_Time**: The latest time by which a booking must end (set by owner)
- **Max_Booking_Duration**: The maximum consecutive time (in minutes) a user can book in one session (set by owner)
- **Blocked_Slot**: A specific time range on a specific date that the owner has marked as unavailable
- **Consecutive_Selection**: User must select adjacent time slots without gaps (e.g., 10:00, 10:30, 11:00 — not 10:00 and 11:00 skipping 10:30)

## Requirements

### Requirement 1: Service Listing Time Configuration

**User Story:** As a service provider, I want to configure operating hours and maximum booking duration for my service listing, so that customers can only book within my available times.

#### Acceptance Criteria

1. THE service listing SHALL include an `opening_time` field representing the earliest bookable time (stored as HH:MM in 24-hour format)
2. THE service listing SHALL include a `closing_time` field representing the latest time by which a booking must end (stored as HH:MM in 24-hour format)
3. THE service listing SHALL include a `max_booking_duration` field representing the maximum consecutive booking time in minutes
4. WHEN a service listing does not have these fields set, THE system SHALL use defaults: opening_time "08:00", closing_time "20:00", max_booking_duration 480
5. THE `max_booking_duration` SHALL be a multiple of 30 (e.g., 30, 60, 90, 120, etc.)
6. THE `opening_time` SHALL be earlier than `closing_time`

### Requirement 2: 30-Minute Slot Generation

**User Story:** As a user, I want to see available 30-minute time slots for my selected date, so that I can choose exactly when I need the service.

#### Acceptance Criteria

1. WHEN a user selects a date on the calendar, THE Slot_Grid SHALL generate time slots starting from `opening_time` and ending at `closing_time` in 30-minute increments
2. EACH Time_Slot SHALL display its start time (e.g., "10:00 AM", "10:30 AM", "11:00 AM")
3. THE Slot_Grid SHALL NOT display slots that start after `closing_time - 30 minutes` (last slot must end by closing time)
4. THE Slot_Grid SHALL display slots in a grid layout (3 columns) for easy scanning

### Requirement 3: Consecutive Slot Selection

**User Story:** As a user, I want to select multiple consecutive time slots, so that I can book a longer duration for my service.

#### Acceptance Criteria

1. THE minimum selection SHALL be 1 slot (30 minutes)
2. THE maximum selection SHALL be limited by `max_booking_duration / 30` slots
3. WHEN the user taps a slot, THE system SHALL select it and allow extending the selection by tapping adjacent slots
4. THE system SHALL only allow Consecutive_Selection — gaps between selected slots are not permitted
5. WHEN the user taps a non-adjacent slot, THE system SHALL start a new selection from that slot (clearing previous selection)
6. THE Slot_Grid SHALL display a summary showing: selected time range and total duration (e.g., "10:00 AM – 12:00 PM (2 hours)")

### Requirement 4: Slot Availability Check

**User Story:** As a user, I want to see which time slots are already booked or blocked, so that I don't try to book unavailable times.

#### Acceptance Criteria

1. WHEN a date is selected, THE system SHALL fetch existing bookings for that date from the API
2. Time_Slots that overlap with existing confirmed bookings SHALL be displayed as disabled (greyed out, not tappable)
3. Time_Slots that overlap with Blocked_Slots SHALL be displayed as disabled
4. Time_Slots in the past (for today's date) SHALL be displayed as disabled
5. THE Slot_Grid SHALL visually distinguish between: available (default), selected (primary color), booked (greyed), and blocked (greyed with indicator)

### Requirement 5: Owner Blocked Time Slots

**User Story:** As a service provider, I want to block specific time ranges on specific dates, so that I can mark breaks, appointments, or unavailable periods.

#### Acceptance Criteria

1. THE service listing SHALL support a `blocked_slots` field containing an array of date-specific time blocks
2. EACH blocked slot entry SHALL contain: date (YYYY-MM-DD), start time (HH:MM), and end time (HH:MM)
3. THE booked-dates API response SHALL include `blocked_slots` alongside bookings and blocked_dates
4. THE Slot_Grid SHALL treat blocked slots identically to booked slots (disabled, not selectable)
5. Blocked slot times SHALL align to 30-minute boundaries (e.g., 12:00, 12:30 — not 12:15)

### Requirement 6: Booking Creation with Time Slots

**User Story:** As a user, I want my booking to record the exact start and end time I selected, so that the service provider knows when to expect me.

#### Acceptance Criteria

1. WHEN the user confirms a booking, THE system SHALL send `start_time` as the beginning of the first selected slot and `end_time` as the end of the last selected slot
2. THE `start_time` and `end_time` SHALL be stored in HH:MM format (24-hour) in the database
3. THE booking confirmation page SHALL display the booked time range (e.g., "10:00 AM – 12:00 PM")
4. THE view-booking page SHALL display the booked time range
5. THE my-bookings list SHALL display the time range on each service booking card

### Requirement 7: Backward Compatibility

**User Story:** As a developer, I want existing bookings and listings to continue working, so that no data is lost during the transition.

#### Acceptance Criteria

1. Existing service listings without `opening_time`, `closing_time`, or `max_booking_duration` SHALL use default values
2. Existing bookings with session-based `start_time`/`end_time` (e.g., "08:00 AM") SHALL continue to display correctly
3. THE booked-dates API SHALL return both old-format and new-format bookings in the same response
4. THE Slot_Grid SHALL correctly mark old session-based bookings as occupied slots
