# Requirements Document

## Introduction

This document specifies requirements for six infrastructure and quality improvements to the ZVenue platform (Expo React Native mobile app + Fastify backend + Neon PostgreSQL). These improvements cover error monitoring, mobile unit testing, Redis caching, deep linking, row-level security, and a staging environment. Together they strengthen observability, performance, security, shareability, code quality, and deployment safety.

## Glossary

- **Mobile_App**: The ZVenue Expo React Native mobile application (SDK 54, expo-router)
- **Backend**: The Fastify 5 API server with Drizzle ORM connecting to Neon PostgreSQL
- **Sentry_SDK**: The Sentry error monitoring library integrated into Mobile_App and Backend
- **Test_Runner**: The Jest testing framework configured for the Mobile_App
- **Cache_Layer**: The Redis-based caching system integrated into the Backend
- **Deep_Link_Handler**: The expo-linking based system that resolves incoming URLs to specific app screens
- **RLS_Policy**: A PostgreSQL Row Level Security policy applied to database tables
- **Staging_Environment**: A separate deployment environment with its own Neon database branch for pre-production validation
- **Auth_Store**: The Zustand-based authentication state store in the Mobile_App (store/authStore.ts)
- **API_Client**: The HTTP client functions in lib/api.ts and lib/serviceApi.ts
- **CI_Pipeline**: The GitHub Actions workflow that builds, tests, and deploys the application

## Requirements

### Requirement 1: Error Monitoring — Mobile App Sentry Integration

**User Story:** As a developer, I want unhandled exceptions and crashes in the mobile app captured automatically, so that I can identify and fix production issues quickly.

#### Acceptance Criteria

1. WHEN the Mobile_App starts, THE Sentry_SDK SHALL initialize with the configured DSN and environment tag
2. WHEN an unhandled JavaScript exception occurs in the Mobile_App, THE Sentry_SDK SHALL capture the exception with a full stack trace and send it to the Sentry dashboard
3. WHEN a native crash occurs in the Mobile_App, THE Sentry_SDK SHALL capture the crash report and send it to the Sentry dashboard
4. WHEN an EAS build is created, THE CI_Pipeline SHALL upload source maps to Sentry for the corresponding release version
5. THE Sentry_SDK SHALL attach the authenticated user ID to all captured events WHILE a user is logged in

### Requirement 2: Error Monitoring — Backend Sentry Integration

**User Story:** As a developer, I want API errors and unhandled exceptions on the backend captured automatically, so that I can monitor server health and debug production issues.

#### Acceptance Criteria

1. WHEN the Backend starts, THE Sentry_SDK SHALL initialize with the configured DSN and environment tag
2. WHEN an unhandled exception occurs during request processing, THE Sentry_SDK SHALL capture the exception with request context including HTTP method, URL path, and response status code
3. WHEN a route handler returns a 5xx status code, THE Sentry_SDK SHALL capture the error as a Sentry event
4. IF the Sentry_SDK fails to initialize or send events, THEN THE Backend SHALL log a warning and continue operating without interruption
5. THE Sentry_SDK SHALL attach the authenticated user ID to captured events WHILE a request is made by an authenticated user

### Requirement 3: Mobile Unit Tests — Jest Framework Setup

**User Story:** As a developer, I want a unit testing framework for the mobile app, so that I can verify business logic in isolation without running the full app.

**Existing State:** The Mobile_App package.json already has a `"test": "jest --watchAll"` script, and `babel.config.js` with `babel-preset-expo` exists. However, no Jest package, config file, or test files are present. This requirement completes the setup.

#### Acceptance Criteria

1. THE Test_Runner SHALL execute all test files matching the pattern `**/*.test.ts` and `**/*.test.tsx` in the Mobile_App project
2. WHEN `npm test` is run, THE Test_Runner SHALL execute all unit tests and report pass/fail results with coverage summary
3. THE Test_Runner SHALL support mocking of React Native modules, expo modules, and AsyncStorage
4. WHEN a test file imports from `@react-native-async-storage/async-storage`, THE Test_Runner SHALL provide a mock implementation that simulates storage operations in memory

### Requirement 4: Mobile Unit Tests — Auth Store Tests

**User Story:** As a developer, I want unit tests for the authentication store, so that I can verify login state management, token handling, and logout behavior.

#### Acceptance Criteria

1. WHEN the Auth_Store `login` action is called with valid credentials, THE Test_Runner SHALL verify that the user state is set and the authentication token is persisted
2. WHEN the Auth_Store `logout` action is called, THE Test_Runner SHALL verify that the user state is cleared and the stored token is removed
3. WHEN the Auth_Store initializes, THE Test_Runner SHALL verify that the store attempts to restore the previously persisted session
4. IF the Auth_Store `login` action receives an error response, THEN THE Test_Runner SHALL verify that the user state remains unauthenticated and an error is surfaced

### Requirement 5: Mobile Unit Tests — API Function Tests

**User Story:** As a developer, I want unit tests for the API client functions, so that I can verify request construction, response parsing, and error handling.

#### Acceptance Criteria

1. WHEN an API_Client function is called, THE Test_Runner SHALL verify that the correct HTTP method, URL path, and request body are sent
2. WHEN the API_Client receives a successful response, THE Test_Runner SHALL verify that the response data is parsed and returned correctly
3. IF the API_Client receives a network error, THEN THE Test_Runner SHALL verify that the error is propagated with a descriptive message
4. IF the API_Client receives a 401 response, THEN THE Test_Runner SHALL verify that the authentication state is invalidated
5. THE Test_Runner SHALL execute API_Client tests using mocked HTTP responses without making real network requests

### Requirement 6: Redis Caching — Venue and Category Caching

**User Story:** As a developer, I want frequently-read data cached in Redis, so that the Backend responds faster and reduces database load for common queries.

#### Acceptance Criteria

1. WHEN a request for venue listings is received, THE Cache_Layer SHALL return cached data if a valid cache entry exists for the query parameters
2. WHEN no valid cache entry exists for a venue listing request, THE Cache_Layer SHALL fetch data from the database, store it in Redis with a TTL of 5 minutes, and return the data
3. WHEN a request for categories is received, THE Cache_Layer SHALL return cached data if a valid cache entry exists
4. WHEN a request for service categories is received, THE Cache_Layer SHALL return cached data if a valid cache entry exists
5. WHEN a venue is created, updated, or deleted, THE Cache_Layer SHALL invalidate all cached venue listing entries
6. WHEN a category is created, updated, or deleted, THE Cache_Layer SHALL invalidate all cached category entries

### Requirement 7: Redis Caching — Search Result Caching

**User Story:** As a developer, I want search results cached in Redis, so that repeated searches return instantly without re-querying the database.

#### Acceptance Criteria

1. WHEN a search request is received, THE Cache_Layer SHALL generate a cache key based on the search query, city, and filter parameters
2. WHEN a valid cache entry exists for the search key, THE Cache_Layer SHALL return the cached results
3. WHEN no valid cache entry exists, THE Cache_Layer SHALL execute the search query, store results in Redis with a TTL of 3 minutes, and return the results
4. WHEN venue data is mutated, THE Cache_Layer SHALL invalidate all cached search result entries

### Requirement 8: Redis Caching — Rate Limiting Migration

**User Story:** As a developer, I want rate limiting backed by Redis instead of in-memory storage, so that rate limits are shared across server instances and persist across restarts.

**Existing State:** The Backend already uses `@fastify/rate-limit` with in-memory storage and has a custom in-memory OTP rate limiter using `Map()`. This requirement migrates both to Redis-backed storage.

#### Acceptance Criteria

1. THE Backend SHALL use Redis as the backing store for the @fastify/rate-limit plugin
2. WHEN a client exceeds the rate limit, THE Backend SHALL return a 429 status code with a Retry-After header
3. IF the Redis connection is unavailable, THEN THE Backend SHALL fall back to in-memory rate limiting and log a warning

### Requirement 9: Deep Linking — URL Scheme Configuration

**User Story:** As a user, I want to open shared links directly in the ZVenue app, so that I can quickly access specific venues, services, or bookings.

**Existing State:** The Mobile_App already has `"scheme": "zvenue-app"` configured in app.json, `expo-linking` installed, and a stub `app/+native-intent.tsx` that redirects all links to home. This requirement extends the existing stub into a functional deep link router.

#### Acceptance Criteria

1. THE Mobile_App SHALL use the existing URL scheme `zvenue-app` for handling incoming deep links
2. THE Mobile_App SHALL support universal links via the configured web origin `https://zvenue.pages.dev`
3. WHEN the Mobile_App is installed, THE Deep_Link_Handler SHALL register the app as a handler for `zvenue-app://` URLs on both iOS and Android

### Requirement 10: Deep Linking — Route Resolution

**User Story:** As a user, I want deep links to navigate me to the correct screen, so that shared content is immediately visible.

#### Acceptance Criteria

1. WHEN a deep link with path `venue/{id}` is received, THE Deep_Link_Handler SHALL navigate to the venue detail screen with the specified venue ID
2. WHEN a deep link with path `service/{id}` is received, THE Deep_Link_Handler SHALL navigate to the service detail screen with the specified service listing ID
3. WHEN a deep link with path `booking/{id}` is received, THE Deep_Link_Handler SHALL navigate to the booking detail screen with the specified booking ID
4. IF a deep link contains an invalid or non-existent resource ID, THEN THE Deep_Link_Handler SHALL display an error message to the user and navigate to the home screen
5. WHILE the user is not authenticated, WHEN a deep link is received, THE Deep_Link_Handler SHALL store the target route and redirect to the login screen, then navigate to the stored route after successful authentication
6. THE Deep_Link_Handler SHALL replace the existing stub implementation in `app/+native-intent.tsx` with route-specific resolution logic

### Requirement 11: Row Level Security — User Data Protection

**User Story:** As a developer, I want database-level access control on user data, so that even if API middleware is bypassed, users can only access their own records.

#### Acceptance Criteria

1. THE RLS_Policy on the `users` table SHALL allow a user to SELECT only the row where `users.id` matches the authenticated user ID
2. THE RLS_Policy on the `users` table SHALL allow a user to UPDATE only the row where `users.id` matches the authenticated user ID
3. WHEN a query is executed without a valid authenticated user context, THE RLS_Policy SHALL deny access to all rows in the `users` table
4. THE RLS_Policy SHALL allow the Backend service role full access to the `users` table for administrative operations

### Requirement 12: Row Level Security — Booking Data Protection

**User Story:** As a developer, I want database-level access control on bookings, so that users can only view and manage their own bookings.

#### Acceptance Criteria

1. THE RLS_Policy on the `bookings` table SHALL allow a user to SELECT only rows where `bookings.user_id` matches the authenticated user ID
2. THE RLS_Policy on the `service_bookings` table SHALL allow a user to SELECT only rows where `service_bookings.user_id` matches the authenticated user ID
3. THE RLS_Policy SHALL allow the Backend service role full access to booking tables for order processing and administrative operations
4. WHEN a user attempts to access a booking belonging to another user via direct SQL, THE RLS_Policy SHALL return zero rows

### Requirement 13: Row Level Security — Notification and Favorites Protection

**User Story:** As a developer, I want database-level access control on notifications and favorites, so that users can only see their own notifications and favorites.

#### Acceptance Criteria

1. THE RLS_Policy on the `notifications` table SHALL allow a user to SELECT only rows where `notifications.user_id` matches the authenticated user ID
2. THE RLS_Policy on the `notifications` table SHALL allow a user to UPDATE only rows where `notifications.user_id` matches the authenticated user ID (for marking as read)
3. THE RLS_Policy on the `service_favorites` table SHALL allow a user to SELECT, INSERT, and DELETE only rows where `service_favorites.user_id` matches the authenticated user ID
4. THE RLS_Policy SHALL allow the Backend service role full access to notifications and favorites tables for system-generated notifications and administrative operations

### Requirement 14: Staging Environment — Database Branch

**User Story:** As a developer, I want a separate staging database, so that I can test migrations and data changes without risking production data.

#### Acceptance Criteria

1. THE Staging_Environment SHALL use a separate Neon database branch created from the production branch
2. THE Staging_Environment database branch SHALL have its own connection string distinct from production
3. WHEN a new migration is created, THE CI_Pipeline SHALL apply the migration to the Staging_Environment database before production
4. THE Staging_Environment database SHALL contain seed data representative of production without containing actual user data

### Requirement 15: Staging Environment — Configuration and Deployment

**User Story:** As a developer, I want environment-specific configurations and a staging deployment pipeline, so that I can validate changes in a production-like environment before releasing.

#### Acceptance Criteria

1. THE Backend SHALL load configuration from environment-specific files based on a `NODE_ENV` variable (development, staging, production)
2. THE Staging_Environment SHALL have its own Sentry DSN, Redis instance URL, and database connection string
3. WHEN a pull request is merged to the `main` branch, THE CI_Pipeline SHALL deploy the Backend to the Staging_Environment first
4. WHEN the staging deployment succeeds and passes health checks, THE CI_Pipeline SHALL proceed to deploy to the production environment
5. IF the staging deployment fails or health checks do not pass, THEN THE CI_Pipeline SHALL halt the deployment and notify the development team via GitHub Actions failure notification
