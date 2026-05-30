# Render Deployment Guide — ZVenue Test Environment

## What Gets Deployed

| Service | Type | URL Pattern |
|---------|------|-------------|
| Backend API | Web Service (Free) | `zvenue-api.onrender.com` |
| Admin Panel | Static Site (Free) | `zvenue-admin.onrender.com` |

---

## Step 1: Push Code to GitHub

Make sure your latest code is pushed:
```bash
git add .
git commit -m "Add Render deployment config"
git push origin main
```

---

## Step 2: Deploy on Render

### Option A: Blueprint (Automatic — uses render.yaml)

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **New** → **Blueprint**
3. Connect your GitHub repo (`Zvenue-main/zvenue`)
4. Render detects `render.yaml` and creates both services
5. Fill in the environment variables marked `sync: false` (see Step 3)

### Option B: Manual (if Blueprint doesn't work)

**Backend API:**
1. Click **New** → **Web Service**
2. Connect your GitHub repo
3. Settings:
   - **Name:** `zvenue-api`
   - **Root Directory:** `admin/server`
   - **Runtime:** Node
   - **Build Command:** `npm ci`
   - **Start Command:** `node index.js`
   - **Plan:** Free
4. Add environment variables (Step 3)

**Admin Panel:**
1. Click **New** → **Static Site**
2. Connect same repo
3. Settings:
   - **Name:** `zvenue-admin`
   - **Root Directory:** `admin`
   - **Build Command:** `npm ci && npm run build`
   - **Publish Directory:** `dist`
   - **Plan:** Free
4. Add environment variable: `VITE_API_URL` = your backend URL

---

## Step 3: Environment Variables

### Backend API (zvenue-api)

Set these in Render Dashboard → zvenue-api → Environment:

| Key | Value |
|-----|-------|
| `PORT` | `3001` |
| `NODE_ENV` | `production` |
| `DATABASE_URL` | `postgresql://neondb_owner:npg_3A5YshavEQFz@ep-ancient-math-aok29di2-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require` |
| `JWT_SECRET` | `supersecret_zvenue_key_123` |
| `RAZORPAY_KEY_ID` | `rzp_test_SpDyznKPQ9nviQ` |
| `RAZORPAY_KEY_SECRET` | `LMWGsU2457jFCYYdiVzzmJUM` |
| `RAZORPAY_WEBHOOK_SECRET` | `YourWebhookSecretHere` |
| `ALLOWED_ORIGINS` | `https://zvenue-admin.onrender.com,http://localhost:5173` |
| `AOC_API_KEY` | `Gubga82D2GFVahWVxRF120500APFnG` |
| `AOC_WHATSAPP_NUMBER` | `+917736761562` |
| `AOC_TEMPLATE_NAME` | `otp` |
| `AOC_PREBOOKING_TEMPLATE_NAME` | `prebooking_alert` |
| `MSG2Z_USER_ID` | `zvenue` |
| `MSG2Z_PASSWORD` | `@zHhBFi2` |
| `MSG2Z_SENDER_ID` | `ZVENUE` |
| `MSG2Z_ENTITY_ID` | `1701177875328026717` |
| `MSG2Z_TEMPLATE_ID` | `1707177882344538316` |
| `BETTER_AUTH_SECRET` | `da74adfc183124b29f38d1041e709b8a99bf95b1a07c4da76279dfa5e9a4d923` |
| `BETTER_AUTH_URL` | `https://zvenue-api.onrender.com` |

### Admin Panel (zvenue-admin)

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://zvenue-api.onrender.com` |
| `VITE_CLOUDINARY_CLOUD` | `dxprjeaun` |
| `VITE_CLOUDINARY_PRESET` | `zvenue_unsigned` |

---

## Step 4: Update Mobile App

After deploy, update your mobile app to point to Render:

**For testing (EAS build):**
Update `eas.json`:
```json
"preview": {
  "env": {
    "EXPO_PUBLIC_API_URL": "https://zvenue-api.onrender.com",
    "EXPO_PUBLIC_RAZORPAY_KEY": "rzp_test_SpDyznKPQ9nviQ",
    "EXPO_PUBLIC_CLOUDINARY_CLOUD": "dxprjeaun",
    "EXPO_PUBLIC_CLOUDINARY_PRESET": "zvenue_unsigned"
  }
}
```

**For local dev (emulator):**
Update `.env`:
```
EXPO_PUBLIC_API_URL=https://zvenue-api.onrender.com
EXPO_PUBLIC_RAZORPAY_KEY=rzp_test_SpDyznKPQ9nviQ
EXPO_PUBLIC_CLOUDINARY_CLOUD=dxprjeaun
EXPO_PUBLIC_CLOUDINARY_PRESET=zvenue_unsigned
```

---

## Step 5: Verify Deployment

After both services are deployed:

```bash
# Check backend health
curl https://zvenue-api.onrender.com/health

# Check admin panel
# Open https://zvenue-admin.onrender.com in browser
```

---

## Step 6: Set Up Razorpay Webhook (Test)

In Razorpay Dashboard → Settings → Webhooks:
- **URL:** `https://zvenue-api.onrender.com/api/webhooks/razorpay`
- **Secret:** Same as `RAZORPAY_WEBHOOK_SECRET`
- **Events:** All payment + subscription events

---

## Free Tier Notes

⚠️ **Render free tier spins down after 15 minutes of inactivity.**

- First request after idle: ~30-50 seconds (cold start)
- Subsequent requests: normal speed
- The app stays awake as long as there's traffic

**To keep it awake (optional):** Use a free cron service like [cron-job.org](https://cron-job.org) to ping `https://zvenue-api.onrender.com/health` every 14 minutes.

---

## Redeployment

Render auto-deploys on every push to `main`. To manually redeploy:
1. Go to Render Dashboard → your service
2. Click **Manual Deploy** → **Deploy latest commit**

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Build fails | Check build logs in Render dashboard |
| 502 error | Backend crashed — check logs, might be missing env var |
| Admin panel shows blank | Check `VITE_API_URL` is set correctly |
| CORS error | Add admin panel URL to `ALLOWED_ORIGINS` |
| Cold start too slow | Upgrade to $7/mo plan or use keep-alive ping |
| Webhook not received | Check URL is correct, server is awake |
