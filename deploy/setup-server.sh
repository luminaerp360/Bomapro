#!/bin/bash
set -e

# ============================================================
# Bomapro - Server Initial Setup Script (Shared VPS Safe)
# Run this ONCE on your VPS to set up Bomapro alongside Lumina ERP
# Usage: bash setup-server.sh
# ============================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()  { echo -e "${GREEN}[SETUP]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }

PROJECT_DIR="/opt/bomapro"

echo ""
echo "=============================================="
echo "  Bomapro - Shared VPS Setup"
echo "=============================================="
echo ""

# 1. Verify Docker, Docker Compose, Nginx, Certbot
for cmd in docker nginx certbot; do
  if ! command -v $cmd &> /dev/null; then
    warn "$cmd not found, installing..."
    apt update && apt install -y $cmd
  else
    log "$cmd is already installed"
  fi
done

# 2. Clone or update repository
if [ ! -d "$PROJECT_DIR" ]; then
  log "Cloning Bomapro repository to $PROJECT_DIR..."
  git clone https://github.com/luminaerp360/Bomapro.git "$PROJECT_DIR"
else
  log "Repository already cloned at $PROJECT_DIR"
  cd "$PROJECT_DIR"
  git pull origin main
fi

cd "$PROJECT_DIR"

# 3. Create backend .env if not exists
if [ ! -f "$PROJECT_DIR/bomapro-backend/.env" ]; then
  warn "Creating backend .env file..."
  JWT_SECRET=$(openssl rand -base64 48 | tr -d '\n')
  PORTAL_JWT_SECRET=$(openssl rand -base64 48 | tr -d '\n')
  cat > "$PROJECT_DIR/bomapro-backend/.env" << EOF
# MongoDB on VPS
MONGODB_URI=mongodb://bomapro_user:StrongPass%402025@127.0.0.1:27017/bomapro?authSource=bomapro

# JWT Secrets
JWT_SECRET=${JWT_SECRET}
TENANT_PORTAL_JWT_SECRET=${PORTAL_JWT_SECRET}

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=https://bomaapi.lumina360.tech/api/auth/google/callback

# SMTP / Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=kiprotichkirui301@gmail.com
SMTP_PASS=lrvc uyhr hdye wdoi

# Frontend URL
FRONTEND_URL=https://boma.lumina360.tech

# Port (overridden per blue/green container: 3340 / 3341)
PORT=3340
NODE_ENV=production

# M-Pesa Daraja API (Safaricom)
MPESA_ENVIRONMENT=sandbox
MPESA_CONSUMER_KEY=your-mpesa-consumer-key
MPESA_CONSUMER_SECRET=your-mpesa-consumer-secret
MPESA_SHORTCODE=174379
MPESA_PASSKEY=bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919
MPESA_CALLBACK_URL=https://bomaapi.lumina360.tech/api/tenant-portal/mpesa/callback
EOF
  warn "Review/edit $PROJECT_DIR/bomapro-backend/.env if needed:"
  warn "  nano $PROJECT_DIR/bomapro-backend/.env"
else
  log "Backend .env already exists at $PROJECT_DIR/bomapro-backend/.env"
fi

# 4. Create initial Nginx upstream configs (default to blue: 3340 & 4340)
log "Configuring Nginx upstream files..."
cat > /etc/nginx/conf.d/bomapro-backend-upstream.conf << 'EOF'
upstream bomapro_backend {
    server 127.0.0.1:3340;
    keepalive 32;
}
EOF

cat > /etc/nginx/conf.d/bomapro-frontend-upstream.conf << 'EOF'
upstream bomapro_frontend {
    server 127.0.0.1:4340;
    keepalive 32;
}
EOF

# 5. Setup HTTP-first Nginx configs if SSL certs don't exist yet, then run Certbot
if [ ! -f /etc/letsencrypt/live/bomaapi.lumina360.tech/fullchain.pem ] || [ ! -f /etc/letsencrypt/live/boma.lumina360.tech/fullchain.pem ]; then
  warn "SSL certificates not found yet. Setting up temporary HTTP blocks for Certbot..."

  cat > /etc/nginx/sites-available/bomapro-backend << 'EOF'
server {
    listen 80;
    server_name bomaapi.lumina360.tech;
    location / {
        proxy_pass http://bomapro_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
EOF

  cat > /etc/nginx/sites-available/bomapro-frontend << 'EOF'
server {
    listen 80;
    server_name boma.lumina360.tech;
    location / {
        proxy_pass http://bomapro_frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
EOF

  ln -sf /etc/nginx/sites-available/bomapro-backend /etc/nginx/sites-enabled/
  ln -sf /etc/nginx/sites-available/bomapro-frontend /etc/nginx/sites-enabled/
  nginx -t && systemctl reload nginx

  log "Requesting SSL certificates with Certbot..."
  certbot --nginx -d boma.lumina360.tech -d bomaapi.lumina360.tech --non-interactive --agree-tos --register-unsafely-without-email || warn "Certbot failed — ensure DNS records for boma.lumina360.tech and bomaapi.lumina360.tech point to this VPS IP"
fi

# Copy full SSL Nginx configs once certificates exist
if [ -f /etc/letsencrypt/live/bomaapi.lumina360.tech/fullchain.pem ] && [ -f /etc/letsencrypt/live/boma.lumina360.tech/fullchain.pem ]; then
  cp "$PROJECT_DIR/deploy/nginx-backend.conf" /etc/nginx/sites-available/bomapro-backend
  cp "$PROJECT_DIR/deploy/nginx-frontend.conf" /etc/nginx/sites-available/bomapro-frontend
  ln -sf /etc/nginx/sites-available/bomapro-backend /etc/nginx/sites-enabled/
  ln -sf /etc/nginx/sites-available/bomapro-frontend /etc/nginx/sites-enabled/
  nginx -t && systemctl reload nginx
  log "Production SSL Nginx configs enabled!"
fi

# 6. Ensure deploy.sh is executable
chmod +x "$PROJECT_DIR/deploy/deploy.sh"

# 7. Initial deploy
log "Running initial deployment..."
cd "$PROJECT_DIR"
bash deploy/deploy.sh

echo ""
echo "=============================================="
log "Bomapro VPS setup complete!"
echo "=============================================="
echo ""
echo "Ports used (isolated from Lumina ERP):"
echo "  Backend Blue/Green:  3340 / 3341"
echo "  Frontend Blue/Green: 4340 / 4341"
echo ""
echo "Domains:"
echo "  Frontend: https://boma.lumina360.tech"
echo "  Backend:  https://bomaapi.lumina360.tech"
echo ""
echo "Commands:"
echo "  cd /opt/bomapro"
echo "  bash deploy/deploy.sh              # Deploy all"
echo "  bash deploy/deploy.sh backend      # Deploy backend only"
echo "  bash deploy/deploy.sh frontend     # Deploy frontend only"
echo "  bash deploy/deploy.sh seed         # Seed default users"
echo "  bash deploy/deploy.sh rollback     # Rollback"
echo "  bash deploy/deploy.sh status       # Check status"
echo ""

