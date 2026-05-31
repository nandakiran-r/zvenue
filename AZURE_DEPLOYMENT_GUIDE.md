# Azure B1S VM Deployment Guide — ZVenue Backend + Admin Panel

## Overview

This guide deploys your Fastify backend API and React admin panel on a single Azure B1S Linux VM (free for 12 months). The setup uses Nginx as a reverse proxy with SSL via Let's Encrypt.

**Architecture:**
```
Internet → Nginx (port 80/443)
              ├── /api/* → Fastify (port 3001)
              ├── /health → Fastify (port 3001)
              └── /* → Admin Panel static files (/var/www/admin)
```

---

## Step 1: Create Azure B1S VM

1. Go to [Azure Portal](https://portal.azure.com)
2. Click **Create a resource** → **Virtual Machine**
3. Configure:
   - **Subscription:** Free Trial / Pay-As-You-Go
   - **Resource Group:** Create new → `zvenue-rg`
   - **VM Name:** `zvenue-server`
   - **Region:** Choose closest to your users (e.g., Central India)
   - **Image:** Ubuntu Server 22.04 LTS
   - **Size:** Standard_B1s (1 vCPU, 1 GB RAM) — **Free tier eligible**
   - **Authentication:** SSH public key (recommended) or password
   - **Username:** `azureuser`
4. **Networking:**
   - Allow inbound ports: **SSH (22), HTTP (80), HTTPS (443)**
5. Click **Review + Create** → **Create**
6. Download the SSH key if generated

---

## Step 2: Connect to VM

```bash
# Replace with your VM's public IP
ssh -i ~/.ssh/your-key.pem azureuser@<VM_PUBLIC_IP>
```

---

## Step 3: Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
node --version  # Should show v20.x
npm --version

# Install Nginx
sudo apt install -y nginx

# Install PM2 (process manager for Node.js)
sudo npm install -g pm2

# Install Certbot (for SSL)
sudo apt install -y certbot python3-certbot-nginx

# Install Git
sudo apt install -y git
```

---

## Step 4: Clone and Set Up Backend

```bash
# Clone your repo
cd /home/azureuser
git clone https://github.com/YOUR_USERNAME/Zvenue-main.git
cd Zvenue-main/zvenue

# Install backend dependencies
cd admin/server
npm ci --production

# Create .env file
nano .env
```

Paste your production `.env` content:
```env
PORT=3001
DATABASE_URL="postgresql://neondb_owner:YOUR_PASSWORD@YOUR_NEON_HOST/neondb?sslmode=require"
ALLOWED_ORIGINS=https://yourdomain.com,https://admin.yourdomain.com
JWT_SECRET=your_production_jwt_secret_here
BACKEND_PUBLIC_URL=https://yourdomain.com

# Razorpay (LIVE keys)
RAZORPAY_KEY_ID=rzp_live_XXXXX
RAZORPAY_KEY_SECRET=your_live_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# AOC WhatsApp
AOC_API_KEY=your_aoc_key
AOC_WHATSAPP_NUMBER=+917249111100
AOC_TEMPLATE_NAME=otp
AOC_PREBOOKING_TEMPLATE_NAME=booking_notification
AOC_SERVICE_BOOKING_TEMPLATE_NAME=notification
AOC_OWNER_PREBOOKING_TEMPLATE_NAME=pre_booking_owner_notification
AOC_INVOICE_TEMPLATE_NAME=booking_confirmation_invoice

# MSG2Z SMS
MSG2Z_USER_ID=zvenue
MSG2Z_PASSWORD=your_password
MSG2Z_SENDER_ID=ZVENUE
MSG2Z_ENTITY_ID=1701177875328026717
MSG2Z_TEMPLATE_ID=1707177882344538316
```

Save and exit (`Ctrl+X`, `Y`, `Enter`).

---

## Step 5: Build Admin Panel

```bash
# Go to admin directory
cd /home/azureuser/Zvenue-main/zvenue/admin

# Install dependencies
npm ci

# Build the admin panel
VITE_API_URL=https://yourdomain.com npm run build

# Copy built files to Nginx serve directory
sudo mkdir -p /var/www/admin
sudo cp -r dist/* /var/www/admin/
sudo chown -R www-data:www-data /var/www/admin
```

---

## Step 6: Start Backend with PM2

```bash
cd /home/azureuser/Zvenue-main/zvenue/admin/server

# Start with PM2
pm2 start index.js --name zvenue-api

# Save PM2 process list (auto-restart on reboot)
pm2 save

# Set PM2 to start on boot
pm2 startup
# Run the command it outputs (starts with sudo env PATH=...)
```

Verify it's running:
```bash
curl http://localhost:3001/health
# Should return: {"status":"ok","uptime":...}
```

---

## Step 7: Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/zvenue
```

Paste this configuration:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Admin panel (static files)
    root /var/www/admin;
    index index.html;

    # API routes → proxy to Fastify
    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        client_max_body_size 10M;
    }

    # Health check → proxy to Fastify
    location /health {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Admin panel SPA fallback (for client-side routing)
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Enable the site:
```bash
# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Enable zvenue site
sudo ln -s /etc/nginx/sites-available/zvenue /etc/nginx/sites-enabled/

# Test config
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

## Step 8: Set Up SSL (HTTPS)

First, point your domain's DNS A record to the VM's public IP.

Then:
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Follow the prompts (enter email, agree to terms). Certbot will:
- Obtain SSL certificate
- Auto-configure Nginx for HTTPS
- Set up auto-renewal

Verify auto-renewal:
```bash
sudo certbot renew --dry-run
```

---

## Step 9: Configure Firewall

```bash
# Allow only necessary ports
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

---

## Step 10: Update Mobile App

Update your mobile app's `.env` and EAS config:
```env
EXPO_PUBLIC_API_URL=https://yourdomain.com
EXPO_PUBLIC_RAZORPAY_KEY=rzp_live_XXXXX
EXPO_PUBLIC_CLOUDINARY_CLOUD=dxprjeaun
EXPO_PUBLIC_CLOUDINARY_PRESET=zvenue_unsigned
```

Update `eas.json` preview/production env:
```json
"env": {
  "EXPO_PUBLIC_API_URL": "https://yourdomain.com",
  "EXPO_PUBLIC_RAZORPAY_KEY": "rzp_live_XXXXX",
  "EXPO_PUBLIC_CLOUDINARY_CLOUD": "dxprjeaun",
  "EXPO_PUBLIC_CLOUDINARY_PRESET": "zvenue_unsigned"
}
```

---

## Step 11: Set Up Razorpay Webhook

In Razorpay Dashboard → Settings → Webhooks:
- **URL:** `https://yourdomain.com/api/webhooks/razorpay`
- **Events:** payment.captured, payment.failed, refund.processed, subscription.authenticated, subscription.activated, subscription.charged, subscription.halted, subscription.cancelled
- **Secret:** Same as `RAZORPAY_WEBHOOK_SECRET` in your .env

---

## Deployment Script (for future updates)

Create `/home/azureuser/deploy.sh`:
```bash
#!/bin/bash
set -e

echo "🚀 Deploying ZVenue..."

cd /home/azureuser/Zvenue-main/zvenue

# Pull latest code
git pull origin main

# Update backend
echo "📦 Updating backend..."
cd admin/server
npm ci --production
pm2 restart zvenue-api

# Update admin panel
echo "🏗️ Building admin panel..."
cd ../
npm ci
VITE_API_URL=https://yourdomain.com npm run build
sudo cp -r dist/* /var/www/admin/

echo "✅ Deployment complete!"
```

Make it executable:
```bash
chmod +x /home/azureuser/deploy.sh
```

Future deploys: just SSH in and run `./deploy.sh`

---

## Monitoring & Maintenance

### Check status
```bash
pm2 status              # Backend process status
pm2 logs zvenue-api     # View backend logs
sudo systemctl status nginx  # Nginx status
```

### Restart services
```bash
pm2 restart zvenue-api  # Restart backend
sudo systemctl restart nginx  # Restart Nginx
```

### View logs
```bash
pm2 logs zvenue-api --lines 50   # Last 50 log lines
sudo tail -f /var/log/nginx/access.log  # Nginx access log
sudo tail -f /var/log/nginx/error.log   # Nginx error log
```

### Auto-restart on crash
PM2 automatically restarts the backend if it crashes. To verify:
```bash
pm2 show zvenue-api  # Shows restart count, uptime, etc.
```

---

## Cost Summary

| Resource | Cost (12 months) |
|----------|-----------------|
| B1S VM (750 hrs/mo) | **$0** (free tier) |
| 64 GB Managed Disk | **$0** (free tier) |
| SSL Certificate | **$0** (Let's Encrypt) |
| Neon Database | **$0** (free tier) |
| Domain name | ~$10-15/year |
| **Total** | **~$10-15/year** (domain only) |

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Backend not starting | `pm2 logs zvenue-api` — check for errors |
| 502 Bad Gateway | Backend crashed — `pm2 restart zvenue-api` |
| SSL certificate expired | `sudo certbot renew` |
| Out of memory | `free -m` — consider upgrading VM or adding swap |
| Can't connect via SSH | Check Azure NSG rules allow port 22 |
| Webhook not working | Check domain resolves, SSL valid, Nginx proxies /api/ |

### Add swap (if running low on memory):
```bash
sudo fallocate -l 1G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

---

## Security Checklist

- [ ] Change default SSH port (optional but recommended)
- [ ] Disable password authentication (use SSH keys only)
- [ ] Keep system updated (`sudo apt update && sudo apt upgrade`)
- [ ] Use strong JWT_SECRET in production
- [ ] Use Razorpay live keys (not test)
- [ ] Set proper ALLOWED_ORIGINS (only your domain)
- [ ] Enable UFW firewall
- [ ] Set up log rotation for PM2 logs
