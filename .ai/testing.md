# Testing

Three separate, non-integrated test setups — no shared test runner across the repo.

## Mobile app (root) — Jest
Config: `jest.config.js` (jest-expo preset). Run: `npm test` / `npm run test:watch`. Tests live in `__tests__/` (mirrors `lib/`/`store/` structure, not colocated):
- `lib/api.test.ts`, `lib/serviceApi.test.ts` — API client behavior.
- `lib/receipt.test.ts` — receipt generation/display logic.
- `lib/timeSlots.test.ts`, `lib/sessionPricing.test.ts`, `lib/sessionPricingPreservation.test.ts` — booking slot/pricing math, the most business-logic-heavy tests in the repo (uses `fast-check` property-based testing per devDependency).
- `store/authStore.test.ts` — auth state transitions.
No component/screen tests currently (no `__tests__` entries for `app/` screens).

## Admin dashboard (`admin/`) — Vitest (browser mode)
Config implied by `package.json` scripts, runs against real Playwright-driven Chromium (`--browser.headless`), not jsdom — closer to integration testing than typical unit tests. Colocated `*.test.ts(x)` files (e.g. `admin/src/lib/cookies.test.ts`, `handle-server-error.test.ts`, `utils.test.ts`) plus `admin/src/test-utils/`. Commands: `npm run test`, `test:watch`, `test:ui` (Vitest UI), `test:coverage`, `test:browser` (headed). Needs `npm run test:browser:install` once to fetch Playwright's Chromium.

## Backend (`admin/server/`)
`admin/server/tests/` exists but **no test script** in `admin/server/package.json` — check what's in that dir before assuming it's wired to any runner; likely manual/ad-hoc scripts (consistent with the other root-level `test-*.js`/`.cjs` files there: `test-api.js`, `test-insert.js`, `test-razorpay.cjs`, `test-sub.cjs`).

## E2E — Maestro (`.maestro/`)
Targets the mobile app only (not admin). 50+ YAML flows, see `.maestro/README.md` for runner instructions. Notable flow groups:
- Auth: `auth_login_flow`, `auth_signup_flow`, `auth_guard_flow`, `attempt_login_offline`, `login_validation_flow`, `otp_resend`.
- Onboarding: `onboarding_flow`, `onboarding_skip`/`onboarding_skip_step`.
- Booking + payment: `booking_calendar_session`, `booking_confirmed_flow`, `booking_payment_razorpay`, `service_booking_payment`, `subscription_payment`, `tap_book_venue`, `venue_detail_and_booking`.
- Reviews: `review_write_flow`, `review_edit_flow`, `review_submit`, `review_view_all`.
- Permissions/system: `location_permission`, `notification_permission`, `grant_permission`, `tap_while_using`, `tap_allow`, `network_error_handling`, `deep_link_test`.
- Smoke/composite: `happy_path`, `quick_smoke`, `full_test_run`, `complete_e2e`, `noop` (likely a harness sanity check).
`maestro_test_summary.md` in repo root documents a prior full test run's results — check its date before trusting it as current status.

## CI (`.github/workflows/ci.yml`)
Only covers **admin**: installs deps for `admin` and `admin/server`, runs non-blocking `tsc --noEmit` on admin, then a separate job builds admin and uploads `dist` as artifact. **Nothing runs the Jest suite, Vitest suite, server tests, or Maestro in CI** — all currently manual/local-only. Worth flagging if asked to improve CI coverage.
