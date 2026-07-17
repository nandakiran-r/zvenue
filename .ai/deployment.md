# Deployment

Three independent deploy targets, no unified CD pipeline.

## Backend API (`admin/server/`) — Render
`render.yaml` blueprint, service `zvenue-api`: Node web service, region Singapore, `rootDir: admin/server`, build `npm ci`, start `node index.js`, health check `/health`, `autoDeploy: true`. Env vars (all `sync: false` = set manually in Render dashboard, not in repo): `DATABASE_URL` (Neon Postgres), `JWT_SECRET`, `RAZORPAY_KEY_ID`/`RAZORPAY_KEY_SECRET`/`RAZORPAY_WEBHOOK_SECRET`, `ALLOWED_ORIGINS` (CORS allowlist), `AOC_API_KEY`/`AOC_WHATSAPP_NUMBER` + `MSG2Z_*` (two alternate WhatsApp/SMS providers for OTP/invoice delivery — check `admin/server/lib/invoice.js` for which is actually active), `BETTER_AUTH_SECRET`/`BETTER_AUTH_URL`. Also see `RENDER_DEPLOYMENT.md` at repo root for narrative instructions.
There's also `admin/server/Dockerfile` — containerized deploy is possible as an alternative/backup to Render's native Node runtime; check which is actually in use before assuming Render builds from source only.

## Admin dashboard (`admin/`) — Render static site
Same `render.yaml`, service `zvenue-admin`: static site, `rootDir: admin`, build `npm ci && npm run build`, publish `dist/`, SPA rewrite (`/* → /index.html`). Env: `VITE_API_URL` (manual), `VITE_CLOUDINARY_CLOUD`/`VITE_CLOUDINARY_PRESET` (hardcoded values, not secret).

## Mobile app (root) — EAS Build
`eas.json`: three profiles.
- `development` — dev client, internal distribution.
- `preview` — APK, internal distribution, points at **live prod API** (`https://www.zvenue.in`) and **live Razorpay key** (`rzp_live_...` embedded in repo).
- `production` — app-bundle (for Play Store), API URL is still the **placeholder** `https://your-backend-domain.com` — update before running a real production build.
No CI/CD wiring for EAS builds found (no GitHub Action triggers `eas build`) — builds are manual (`eas build --profile ...`).
Also see `AZURE_DEPLOYMENT_GUIDE.md`, `CLOUDFLARE_TUNNEL_GUIDE.md` at repo root — alternative/historical deployment docs, verify currency before following (may predate the Render setup, which looks like the current path given `render.yaml` + `RENDER_DEPLOYMENT.md` presence).

## Local dev tunneling
`cloudflared-config.yml`, `start-local-server.sh`, `test-ngrok.js` — tooling to expose local backend (port 3001) to a real device/Expo Go during development, since mobile devices can't hit `localhost`.

## Secrets hygiene flags (worth surfacing to user)
- Live Razorpay key committed in `eas.json` (`preview` profile).
- `GoogleService-Info.plist` and `google-services.json` committed (normal for Expo/Firebase, but confirm these are the intended prod Firebase project, not a dev one).
- `.env.production.example` exists at root — actual `.env`/`.env.production` presumably gitignored (confirm via `.gitignore`) but no `.env.example` for local dev API URL found at a glance — check before assuming onboarding docs are complete.
