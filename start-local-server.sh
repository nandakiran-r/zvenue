#!/bin/bash
# ZVenue Local Server with Cloudflare Tunnel
# URLs: https://avenue.waxon.in (API) + https://zvenueadmin.waxon.in (Admin)
# Usage: ./start-local-server.sh

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}       ZVenue Local Server + Cloudflare         ${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Kill existing processes
kill $(lsof -t -i:3001) 2>/dev/null || true
kill $(lsof -t -i:5173) 2>/dev/null || true

# Start Backend
echo -e "${GREEN}[1/3] Starting Backend...${NC}"
cd admin/server
node index.js &
BACKEND_PID=$!
cd ../..
sleep 2

if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo -e "  ✅ Backend running on port 3001"
else
    echo "  ❌ Backend failed to start. Check admin/server/.env"
    exit 1
fi

# Start Admin Panel
echo -e "${GREEN}[2/3] Starting Admin Panel...${NC}"
cd admin
npm run dev -- --host &
ADMIN_PID=$!
cd ..
sleep 4
echo -e "  ✅ Admin panel running on port 5173"

# Start Cloudflare Tunnel
echo -e "${GREEN}[3/3] Starting Cloudflare Tunnel...${NC}"
cloudflared tunnel run &
TUNNEL_PID=$!
sleep 3
echo -e "  ✅ Cloudflare Tunnel connected"

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}📱 Mobile App API:${NC}  https://avenue.waxon.in"
echo -e "${YELLOW}🖥️  Admin Panel:${NC}    https://zvenueadmin.waxon.in"
echo -e "${YELLOW}🔧 Local Backend:${NC}   http://localhost:3001"
echo -e "${YELLOW}🔧 Local Admin:${NC}     http://localhost:5173"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Press Ctrl+C to stop all services."
echo ""

# Cleanup on exit
cleanup() {
    echo ""
    echo "Shutting down..."
    kill $BACKEND_PID 2>/dev/null
    kill $ADMIN_PID 2>/dev/null
    kill $TUNNEL_PID 2>/dev/null
    echo "Done. ✅"
    exit 0
}

trap cleanup SIGINT SIGTERM
wait
