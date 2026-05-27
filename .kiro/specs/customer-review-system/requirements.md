# Requirements Document

## Introduction

A comprehensive customer review system for the Zvenue mobile app that allows users to rate and review venues they have booked. Reviews are stored locally and synced to the backend server, contributing to venue ratings visible to all users. The system includes review submission, display, moderation, and aggregation capabilities.

## Glossary

- **Review_System**: The complete feature encompassing review submission, storage, display, and synchronization
- **Review**: A user-generated assessment of a venue consisting of a star rating (1-5) and an optional text comment
- **Reviewer**: An authenticated user who has completed a booking at a venue and is eligible to submit a review
- **Venue_Detail_Screen**: The existing screen in the Zvenue app that displays venue information, ratings, and amenities
- **Review_API**: The backend REST API endpoints responsible for creating, reading, updating, and deleting reviews
- **Rating_Aggregator**: The server-side component that recalculates a venue's average rating and review count when reviews change
- **Review_Card**: A UI component that displays a single review with the reviewer's name, avatar, rating, comment, and timestamp
- **Sync_Engine**: The client-side component responsible for queuing reviews locally and syncing them to the backend when connectivity is available
- **Admin_Panel**: The existing web-based administration interface used by Zvenue staff to manage venues, bookings, and users

## Requirements

### Requirement 1: Review Submission

**User Story:** As a Reviewer, I want to submit a star rating and optional text review for a venue I have booked, so that I can share my experience with other users.

#### Acceptance Criteria

1. WHEN a Reviewer navigates to the review submission screen for a venue, THE Review_System SHALL display a star rating input with values from 1 to 5 in whole-star increments.
2. WHEN a Reviewer selects a star rating and submits the review, THE Review_System SHALL save the review with the selected rating, optional text comment (up to 500 characters), the Reviewer's user ID, the venue ID, and the current timestamp.
3. IF a Reviewer attempts to submit a review without selecting a star rating, THEN THE Review_System SHALL display an inline validation error message indicating that a star rating is required, and prevent submission.
4. WHEN a Reviewer submits a review successfully, THE Review_System SHALL display a confirmation message for no longer than 5 seconds and navigate the Reviewer back to the Venue_Detail_Screen.
5. IF a Reviewer has already submitted a review for a specific venue, THEN THE Review_System SHALL pre-populate the review form with the existing rating and text comment, allow the Reviewer to modify either field, and update the existing review's timestamp upon successful resubmission.
6. IF a Reviewer attempts to submit a review for a venue they have not completed a booking for, THEN THE Review_System SHALL prevent submission and display an error message indicating that a completed booking is required to submit a review.
7. IF a review submission fails due to a server or network error, THEN THE Review_System SHALL display an error message indicating the submission was unsuccessful, preserve the entered rating and text comment, and allow the Reviewer to retry submission.

### Requirement 2: Review Eligibility

**User Story:** As a Reviewer, I want the system to verify that I have completed a booking before allowing me to review a venue, so that only genuine customers can leave reviews.

#### Acceptance Criteria

1. WHEN a user attempts to submit a review for a venue, THE Review_System SHALL verify that the user has at least one booking with status "confirmed" or "pre_booked" for that venue where the booking date is on or before the current date.
2. IF a user attempts to submit a review and has no booking with status "confirmed" or "pre_booked" for that venue (or all qualifying bookings have a future booking date), THEN THE Review_System SHALL reject the submission and display a message indicating that only users who have booked and visited the venue can leave reviews.
3. WHEN an authenticated user views the Venue_Detail_Screen, THE Review_System SHALL display a "Write a Review" button only if the user has at least one booking with status "confirmed" or "pre_booked" for that venue where the booking date is on or before the current date.
4. IF a user is not authenticated, THEN THE Review_System SHALL not display the "Write a Review" button on the Venue_Detail_Screen.
5. IF a booking's status changes to "cancelled" or "refunded" after the user has submitted a review for that venue, THEN THE Review_System SHALL retain the existing review provided the user has at least one other qualifying booking for that venue; otherwise THE Review_System SHALL hide the review from public display.

### Requirement 3: Review Display on Venue Detail

**User Story:** As a user, I want to see reviews from other customers on the venue detail page, so that I can make informed booking decisions.

#### Acceptance Criteria

1. WHEN a user views the Venue_Detail_Screen for a venue that has one or more reviews, THE Review_System SHALL display the venue's average rating (rounded to one decimal place, range 1.0 to 5.0) and total review count in the venue header section.
2. IF a user views the Venue_Detail_Screen for a venue that has zero reviews, THEN THE Review_System SHALL display a message indicating no reviews are available yet and hide the average rating display.
3. WHEN a user views the Venue_Detail_Screen for a venue that has one or more reviews, THE Review_System SHALL display up to 3 most recent reviews as Review_Cards below the venue description.
4. THE Review_Card SHALL display the Reviewer's full name, avatar image (or a default placeholder icon if no avatar is available), star rating (1-5), text comment truncated to 150 characters with a "Read more" indicator if the full comment exceeds 150 characters, and relative timestamp (e.g., "2 days ago").
5. WHEN a user views the Venue_Detail_Screen for a venue that has more than 3 reviews, THE Review_System SHALL display a "See All Reviews" button below the Review_Cards.
6. WHEN a user taps "See All Reviews" on the Venue_Detail_Screen, THE Review_System SHALL navigate to a dedicated reviews list screen showing all reviews for that venue sorted by most recent first.
7. WHEN the reviews list screen is displayed, THE Review_System SHALL support infinite scroll pagination loading 10 reviews per page.
8. IF the Review_System fails to load the next page of reviews during pagination, THEN THE Review_System SHALL display an inline error message with a "Retry" option and preserve the already-loaded reviews on screen.

### Requirement 4: Rating Aggregation

**User Story:** As a venue owner, I want the venue's average rating to update automatically when new reviews are submitted, so that the displayed rating is always current.

#### Acceptance Criteria

1. WHEN a new review is submitted via the Review_API, THE Rating_Aggregator SHALL recalculate the venue's average rating as the arithmetic mean of all review ratings for that venue, rounded to one decimal place using half-up rounding.
2. WHEN a review is updated via the Review_API, THE Rating_Aggregator SHALL recalculate the venue's average rating and review count within the same database transaction as the update operation.
3. WHEN a review is deleted via the Review_API, THE Rating_Aggregator SHALL recalculate the venue's average rating and review count within the same database transaction as the delete operation.
4. THE Rating_Aggregator SHALL store the computed average rating (rounded to one decimal place) and total review count in the venues table within the same database transaction as the triggering review operation.
5. IF all reviews for a venue are deleted, THEN THE Rating_Aggregator SHALL set the venue's average rating to 0.0 and the review count to 0.
6. IF the rating aggregation fails during the transaction, THEN THE Rating_Aggregator SHALL roll back the entire transaction including the triggering review operation and return an error indicating the review could not be processed.

### Requirement 5: Offline Review Queuing and Sync

**User Story:** As a Reviewer, I want to submit a review even when I have no internet connection, so that I do not lose my review if connectivity is poor.

#### Acceptance Criteria

1. WHEN a Reviewer submits a review and the device has no network connectivity, THE Sync_Engine SHALL store the review in AsyncStorage with a "pending_sync" status, including the rating, comment, venue ID, user ID, and submission timestamp.
2. WHEN network connectivity is restored, THE Sync_Engine SHALL automatically attempt to sync all pending reviews to the Review_API in the order they were submitted (oldest first), with each sync attempt timing out after 30 seconds.
3. IF a sync attempt fails due to a server error (HTTP 5xx or network timeout), THEN THE Sync_Engine SHALL retry the sync up to 3 times with exponential backoff (2s, 4s, 8s delays).
4. IF all 3 retry attempts for a pending review are exhausted, THEN THE Sync_Engine SHALL mark the review status as "sync_failed" and display a notification to the Reviewer indicating the sync failed with an option to retry manually.
5. IF a sync attempt fails due to a client error (HTTP 4xx), THEN THE Sync_Engine SHALL mark the review status as "sync_failed", not retry automatically, and display an error message to the Reviewer indicating the review was rejected by the server.
6. WHEN a pending review is successfully synced, THE Sync_Engine SHALL update the local review status from "pending_sync" to "synced" and store the server-assigned review ID.
7. WHILE a review has "pending_sync" status, THE Review_System SHALL display the review locally on the Venue_Detail_Screen with a visual indicator showing sync is pending.
8. WHILE a review has "pending_sync" status, IF the Reviewer edits the review, THEN THE Sync_Engine SHALL update the locally stored review data and reset the sync queue position to maintain the updated content for the next sync attempt.

### Requirement 6: Review Backend API

**User Story:** As a developer, I want well-defined API endpoints for review CRUD operations, so that the mobile app and admin panel can interact with review data consistently.

#### Acceptance Criteria

1. THE Review_API SHALL expose a POST endpoint at `/api/reviews` that accepts venue_id, user_id, rating (1-5 integer), and comment (optional string, max 500 characters) and returns the created review object including its server-assigned id, venue_id, user_id, rating, comment, created_at, and updated_at fields.
2. THE Review_API SHALL expose a GET endpoint at `/api/venues/:id/reviews` that returns paginated reviews for a venue, accepting `page` (default: 1, minimum: 1) and `limit` (default: 10, minimum: 1, maximum: 50) query parameters, sorted by creation date descending, and including total review count and total page count in the response metadata.
3. THE Review_API SHALL expose a PUT endpoint at `/api/reviews/:id` that allows the original Reviewer to update their review's rating and comment.
4. THE Review_API SHALL expose a DELETE endpoint at `/api/reviews/:id` that allows the original Reviewer or an admin to delete a review.
5. IF the Review_API receives a request with an invalid rating value (less than 1 or greater than 5), THEN THE Review_API SHALL return a 400 status code with a descriptive error message.
6. IF an unauthenticated request is made to a protected Review_API endpoint, THEN THE Review_API SHALL return a 401 status code.
7. IF an authenticated Reviewer attempts to update or delete a review that they do not own and the Reviewer does not have an admin role, THEN THE Review_API SHALL return a 403 status code with an error message indicating insufficient permissions.
8. IF a PUT or DELETE request references a review ID that does not exist, THEN THE Review_API SHALL return a 404 status code with an error message indicating the review was not found.
9. IF a POST request references a venue_id that does not exist in the venues table, THEN THE Review_API SHALL return a 400 status code with an error message indicating the venue was not found.

### Requirement 7: Review Database Schema

**User Story:** As a developer, I want a well-structured database schema for reviews, so that review data is stored efficiently and supports the required queries.

#### Acceptance Criteria

1. THE Review_System SHALL store reviews in a `reviews` table with columns: id (UUID, primary key), venue_id (UUID, foreign key to venues), user_id (UUID, foreign key to users), rating (integer, 1-5), comment (text, nullable, maximum 2000 characters), created_at (timestamp), and updated_at (timestamp).
2. THE Review_System SHALL enforce a unique constraint on the combination of venue_id and user_id to prevent duplicate reviews per user per venue.
3. THE Review_System SHALL define a foreign key from reviews.venue_id to venues.id with ON DELETE CASCADE, and a foreign key from reviews.user_id to users.id with ON DELETE CASCADE, so that reviews are removed when the referenced venue or user is deleted.
4. THE Review_System SHALL create an index on venue_id in the reviews table to optimize queries that fetch reviews for a specific venue.
5. THE Review_System SHALL create an index on user_id in the reviews table to optimize queries that fetch all reviews submitted by a specific user.

### Requirement 8: Review Moderation in Admin Panel

**User Story:** As an admin, I want to view and moderate customer reviews from the admin panel, so that I can remove inappropriate content and maintain platform quality.

#### Acceptance Criteria

1. WHEN an admin navigates to the reviews section in the Admin_Panel, THE Review_System SHALL display a paginated list of all reviews (20 reviews per page) sorted by submission date descending, showing venue name, reviewer name, rating, comment, and submission date for each review.
2. WHEN an admin selects a review for deletion, THE Review_System SHALL display a confirmation dialog identifying the review by venue name and reviewer name before permanently removing the review.
3. WHEN an admin confirms deletion of a review, THE Rating_Aggregator SHALL recalculate the affected venue's average rating and review count within the same transaction as the review deletion.
4. IF a review deletion fails due to a server error, THEN THE Admin_Panel SHALL display an error message indicating the deletion was unsuccessful and retain the review in the list unchanged.
5. THE Admin_Panel SHALL provide filter options to view reviews by venue name, by rating (1-5 individually selectable), and by date range (start date and end date), with filters applied in combination.
6. WHEN no reviews match the applied filters or no reviews exist, THE Admin_Panel SHALL display an empty state message indicating no reviews are available.
