# Cloudflare Tunnel — Host ZVenue Locally with Static URLs

## Why Cloudflare Tunnel?

- **Free** — no monthly cost
- **Static URLs** — doesn't change on restart (unlike ngrok free)
- **Fast** — Cloudflare CDN edge in Mumbai serves your users
- **Secure** — HTTPS by default, no ports to open
- **Reliable** — auto-reconnects if your internet drops briefly

---

## Step 1: Install cloudflared

```bash
# Download and install
curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared.deb

# Verify
cloudflared --version
```

---

## Step 2: Login to Cloudflare

```bash
cloudflared tunnel login
```

This opens a browser — select your Cloudflare account. If you don't have one, create a free account at [cloudflare.com](https://cloudflare.com).

---

## Step 3: Create Tunnels

Create two tunnels — one for the backend API, one for the admin panel:

```bash
# Create backend tunnel
cloudflared tunnel create zvenue-api

# Create admin tunnel
cloudflared tunnel create zvenue-admin
```

Note the **Tunnel IDs** printed (e.g., `a1b2c3d4-...`).

---

## Step 4: Configure DNS (if you have a domain)

If you have a domain on Cloudflare (e.g., `zvenue.com`):

```bash
# Point api.zvenue.com → backend tunnel
cloudflared tunnel route dns zvenue-api api.zvenue.com

# Point admin.zvenue.com → admin tunnel
cloudflared tunnel route dns zvenue-admin admin.zvenue.com
```

If you DON'T have a domain, use Cloudflare's free `trycloudflare.com` (see Quick Start below).

---

## Step 5: Create Config File

Create `~/.cloudflared/config.yml`:

```yaml
# Backend API tunnel
tunnel: <TUNNEL_ID_FOR_API>
credentials-file: /home/jerytom33/.cloudflared/<TUNNEL_ID_FOR_API>.json

ingress:
  - hostname: api.zvenue.com
    service: http://localhost:3001
  - service: http_status:404
```

For the admin panel, create a separate config or use the quick method below.

---

## Quick Start (No Domain Needed)

If you just want to test without a custom domain, use Cloudflare's free quick tunnels:

```bash
# Terminal 1: Start backend
cd ~/Projects/Zvenue-main/zvenue/admin/server
node index.js

# Terminal 2: Tunnel backend (gives you a *.trycloudflare.com URL)
cloudflared tunnel --url http://localhost:3001

# Terminal 3: Start admin panel
cd ~/Projects/Zvenue-main/zvenue/admin
npm run dev

# Terminal 4: Tunnel admin panel
cloudflared tunnel --url http://localhost:5173
```

The `trycloudflare.com` URLs are **random but persistent for the session**. They change when you restart the tunnel.

---

## Permanent Setup (With Domain)

For a permanent setup with your own domain:

### config.yml (single file, multiple services)

```yaml
tunnel: <YOUR_TUNNEL_ID>
credentials-file: /home/jerytom33/.cloudflared/<YOUR_TUNNEL_ID>.json

ingress:
  # Backend API
  - hostname: api.zvenue.com
    service: http://localhost:3001
  # Admin Panel
  - hostname: admin.zvenue.com
    service: http://localhost:5173
  # Catch-all
  - service: http_status:404
```

### Run the tunnel:

```bash
cloudflared tunnel run
```

### Run as a system service (auto-start on boot):

```bash
sudo cloudflared service install
sudo systemctl start cloudflared
sudo systemctl enable cloudflared
```

---

## All-in-One Start Script

Update your `start-local-server.sh` to use Cloudflare Tunnel:

```bash
#!/bin/bash
# Start backend
cd admin/server && node index.js &
sleep 2

# Start admin panel
cd admin && npm run dev &
sleep 3

# Start Cloudflare tunnel
cloudflared tunnel run &

echo "✅ Backend: https://api.zvenue.com"
echo "✅ Admin:   https://admin.zvenue.com"
echo "Press Ctrl+C to stop."
wait
```

---

## Update Mobile App

Once you have your permanent URLs:

**.env:**
```
EXPO_PUBLIC_API_URL=https://api.zvenue.com
```

**eas.json (preview build):**
```json
"env": {
  "EXPO_PUBLIC_API_URL": "https://api.zvenue.com"
}
```

**admin/.env:**
```
VITE_API_URL=https://api.zvenue.com
```

---

## Update Backend CORS

In `admin/server/.env`:
```
ALLOWED_ORIGINS=https://admin.zvenue.com,http://localhost:5173
```

---

## Razorpay Webhook

Update webhook URL in Razorpay Dashboard:
- **URL:** `https://api.zvenue.com/api/webhooks/razorpay`

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `cloudflared` not found | Reinstall: `sudo dpkg -i cloudflared.deb` |
| Tunnel disconnects | Check internet; cloudflared auto-reconnects |
| 502 error | Backend not running on localhost:3001 |
| DNS not resolving | Wait 1-2 min after `tunnel route dns` command |
| Certificate error | Cloudflare handles SSL automatically |

---

## Cost

| Item | Cost |
|------|------|
| Cloudflare account | Free |
| Cloudflare Tunnel | Free |
| SSL certificates | Free (auto) |
| Domain (optional) | ~₹800/year (.com) or free with trycloudflare.com |
| Your electricity + internet | Your existing cost |
