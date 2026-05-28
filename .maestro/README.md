# ZVenue Maestro E2E Tests

## Prerequisites

1. **Maestro CLI** installed: https://maestro.mobile.dev/getting-started/installing-maestro
2. **Test user** configured in your backend:
   - Phone: `+919999999999` (login flow)
   - OTP: `123456` (hardcoded test OTP for CI)
3. App built and running on a device/emulator

## Test Files

| File | Description |
|------|-------------|
| `happy_path.yaml` | **Primary smoke test** — Login → Home → Search → Profile → Logout |
| `auth_login_flow.yaml` | Reusable login flow (used by other tests via `runFlow`) |
| `auth_signup_flow.yaml` | New user registration flow |
| `onboarding_flow.yaml` | Full 3-slide onboarding carousel |
| `onboarding_skip.yaml` | Skip onboarding directly to login |
| `home_browse_venues.yaml` | Browse venues and toggle categories on Home |
| `search_venues.yaml` | Search functionality with text input |
| `profile_navigation.yaml` | Profile menu items and sub-screen navigation |

## Running Tests

```bash
# Run the primary happy path
maestro test .maestro/happy_path.yaml

# Run all tests in the directory
maestro test .maestro/

# Run a specific flow
maestro test .maestro/auth_login_flow.yaml

# Run with a specific device
maestro test --device emulator-5554 .maestro/happy_path.yaml
```

## CI Configuration

For CI environments, configure your backend to:
1. Accept OTP `123456` for phone `+919999999999` without actually sending SMS
2. Seed a test user with that phone number before running tests

## Selector Strategy

Tests use selectors in this priority order:
1. `testID` props (most reliable) — e.g., `otp-input-0`, `search-input`, `otp-verify`
2. Visible text content — e.g., `"Log in or Sign up"`, `"Skip"`
3. Placeholder text — e.g., `"Enter 10-digit number"`

## Adding testIDs

To improve test reliability, add `testID` props to key interactive elements.
Priority elements that would benefit from testIDs:
- Login phone input
- Login submit button
- Onboarding Skip/Next/Get Started buttons
- Tab bar items
- Venue cards
