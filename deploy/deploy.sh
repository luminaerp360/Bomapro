#!/bin/bash
set -e

# ============================================================
# Bomapro - Blue/Green Zero-Downtime Deploy Script
# Usage:
#   ./deploy.sh              # Deploy all (backend + frontend)
#   ./deploy.sh backend      # Deploy backend only
#   ./deploy.sh frontend     # Deploy frontend only
#   ./deploy.sh seed         # Run production database seed inside backend container
#   ./deploy.sh rollback     # Rollback to previous stack
#   ./deploy.sh status       # Show current active stack
# ============================================================

PROJECT_DIR="/opt/bomapro"
BACKEND_STATE_FILE="$PROJECT_DIR/deploy/.active-backend-stack"
FRONTEND_STATE_FILE="$PROJECT_DIR/deploy/.active-frontend-stack"
NGINX_UPSTREAM_DIR="/etc/nginx/conf.d"
REGISTRY="ghcr.io/luminaerp360"
HEALTH_CHECK_RETRIES=60
HEALTH_CHECK_INTERVAL=3

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log()   { echo -e "${GREEN}[DEPLOY]${NC} $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }
info()  { echo -e "${BLUE}[INFO]${NC} $1"; }

# Get current active backend stack
get_active_backend_stack() {
  if [ -f "$BACKEND_STATE_FILE" ]; then
    cat "$BACKEND_STATE_FILE"
  else
    echo "none"
  fi
}

# Get current active frontend stack
get_active_frontend_stack() {
  if [ -f "$FRONTEND_STATE_FILE" ]; then
    cat "$FRONTEND_STATE_FILE"
  else
    echo "none"
  fi
}

# Get the inactive backend stack
get_inactive_backend_stack() {
  local active=$(get_active_backend_stack)
  if [ "$active" = "blue" ]; then
    echo "green"
  else
    echo "blue"
  fi
}

# Get the inactive frontend stack
get_inactive_frontend_stack() {
  local active=$(get_active_frontend_stack)
  if [ "$active" = "blue" ]; then
    echo "green"
  else
    echo "blue"
  fi
}

# Get port mappings (unique ports for shared VPS)
get_backend_port() {
  if [ "$1" = "blue" ]; then echo "3340"; else echo "3341"; fi
}

get_frontend_port() {
  if [ "$1" = "blue" ]; then echo "4340"; else echo "4341"; fi
}

# Check if a container is running
is_container_running() {
  local container_name=$1
  docker ps --format '{{.Names}}' | grep -q "^${container_name}$"
}

# Health check a service
health_check() {
  local service_name=$1
  local port=$2
  local endpoint=$3
  local retries=$HEALTH_CHECK_RETRIES

  log "Health checking $service_name on port $port$endpoint..."

  # Wait briefly for the container to initialize
  sleep 5

  for i in $(seq 1 $retries); do
    local http_code=$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:$port$endpoint" 2>/dev/null || echo "000")

    if [ "$http_code" != "000" ] && [ -n "$http_code" ]; then
      log "$service_name is healthy! (HTTP $http_code, attempt $i/$retries)"
      return 0
    fi

    if [ $((i % 10)) -eq 0 ]; then
      warn "Still waiting for $service_name after $((i * HEALTH_CHECK_INTERVAL))s..."
    else
      info "Waiting for $service_name... ($i/$retries)"
    fi

    sleep $HEALTH_CHECK_INTERVAL
  done

  error "$service_name failed health check after $retries attempts ($((retries * HEALTH_CHECK_INTERVAL))s total)"
  return 1
}

# Switch nginx backend upstream only
switch_nginx_backend() {
  local new_stack=$1
  local backend_port=$(get_backend_port "$new_stack")

  log "Switching Nginx backend to $new_stack stack (port:$backend_port)..."

  cat > "$NGINX_UPSTREAM_DIR/bomapro-backend-upstream.conf" << EOF
# Managed by deploy.sh — DO NOT EDIT MANUALLY
# Active backend stack: $new_stack
upstream bomapro_backend {
    server 127.0.0.1:$backend_port;
    keepalive 32;
}
EOF

  if nginx -t 2>/dev/null; then
    systemctl reload nginx
    log "Nginx backend switched to $new_stack stack"
  else
    error "Nginx config test failed! Keeping current backend stack."
    return 1
  fi
}

# Switch nginx frontend upstream only
switch_nginx_frontend() {
  local new_stack=$1
  local frontend_port=$(get_frontend_port "$new_stack")

  log "Switching Nginx frontend to $new_stack stack (port:$frontend_port)..."

  cat > "$NGINX_UPSTREAM_DIR/bomapro-frontend-upstream.conf" << EOF
# Managed by deploy.sh — DO NOT EDIT MANUALLY
# Active frontend stack: $new_stack
upstream bomapro_frontend {
    server 127.0.0.1:$frontend_port;
    keepalive 32;
}
EOF

  if nginx -t 2>/dev/null; then
    systemctl reload nginx
    log "Nginx frontend switched to $new_stack stack"
  else
    error "Nginx config test failed! Keeping current frontend stack."
    return 1
  fi
}

# Switch both nginx upstreams (for full deployment)
switch_nginx_both() {
  local backend_stack=$1
  local frontend_stack=$2
  local backend_port=$(get_backend_port "$backend_stack")
  local frontend_port=$(get_frontend_port "$frontend_stack")

  log "Switching Nginx to backend:$backend_stack (port:$backend_port), frontend:$frontend_stack (port:$frontend_port)..."

  cat > "$NGINX_UPSTREAM_DIR/bomapro-backend-upstream.conf" << EOF
# Managed by deploy.sh — DO NOT EDIT MANUALLY
# Active backend stack: $backend_stack
upstream bomapro_backend {
    server 127.0.0.1:$backend_port;
    keepalive 32;
}
EOF

  cat > "$NGINX_UPSTREAM_DIR/bomapro-frontend-upstream.conf" << EOF
# Managed by deploy.sh — DO NOT EDIT MANUALLY
# Active frontend stack: $frontend_stack
upstream bomapro_frontend {
    server 127.0.0.1:$frontend_port;
    keepalive 32;
}
EOF

  rm -f "$NGINX_UPSTREAM_DIR/bomapro-upstream.conf"

  if nginx -t 2>/dev/null; then
    systemctl reload nginx
    log "Nginx switched successfully"
  else
    error "Nginx config test failed! Keeping current configuration."
    return 1
  fi
}

# Pull latest images (skip if pull fails and local image exists)
pull_images() {
  local target=$1
  log "Pulling latest images..."

  if [ "$target" = "backend" ] || [ "$target" = "all" ]; then
    set +e
    docker pull "$REGISTRY/bomapro-backend:latest" 2>&1
    local pull_backend=$?
    set -e
    if [ $pull_backend -ne 0 ]; then
      if docker image inspect "$REGISTRY/bomapro-backend:latest" > /dev/null 2>&1; then
        warn "Pull failed, using local backend image"
      else
        error "No backend image available (pull failed and no local image)"
        exit 1
      fi
    fi
  fi
  if [ "$target" = "frontend" ] || [ "$target" = "all" ]; then
    set +e
    docker pull "$REGISTRY/bomapro-frontend:latest" 2>&1
    local pull_frontend=$?
    set -e
    if [ $pull_frontend -ne 0 ]; then
      if docker image inspect "$REGISTRY/bomapro-frontend:latest" > /dev/null 2>&1; then
        warn "Pull failed, using local frontend image"
      else
        error "No frontend image available (pull failed and no local image)"
        exit 1
      fi
    fi
  fi
}

# Start a stack
start_stack() {
  local stack=$1
  local target=$2

  log "Starting $stack stack ($target)..."

  cd "$PROJECT_DIR"

  if [ "$target" = "all" ]; then
    docker compose -f "deploy/docker-compose.$stack.yml" up -d
  elif [ "$target" = "backend" ]; then
    docker compose -f "deploy/docker-compose.$stack.yml" up -d "bomapro-backend-$stack"
  elif [ "$target" = "frontend" ]; then
    docker compose -f "deploy/docker-compose.$stack.yml" up -d "bomapro-frontend-$stack"
  fi
}

# Stop and remove a stack's containers
stop_stack() {
  local stack=$1
  local target=$2

  if [ "$stack" = "none" ]; then return; fi

  log "Stopping $stack stack ($target)..."

  cd "$PROJECT_DIR"

  if [ "$target" = "all" ]; then
    docker compose -f "deploy/docker-compose.$stack.yml" stop 2>/dev/null || true
    docker compose -f "deploy/docker-compose.$stack.yml" rm -f 2>/dev/null || true
  elif [ "$target" = "backend" ]; then
    docker compose -f "deploy/docker-compose.$stack.yml" stop "bomapro-backend-$stack" 2>/dev/null || true
    docker compose -f "deploy/docker-compose.$stack.yml" rm -f "bomapro-backend-$stack" 2>/dev/null || true
  elif [ "$target" = "frontend" ]; then
    docker compose -f "deploy/docker-compose.$stack.yml" stop "bomapro-frontend-$stack" 2>/dev/null || true
    docker compose -f "deploy/docker-compose.$stack.yml" rm -f "bomapro-frontend-$stack" 2>/dev/null || true
  fi
}

# Save active backend stack
save_backend_state() {
  echo "$1" > "$BACKEND_STATE_FILE"
  log "Active backend stack saved: $1"
}

# Save active frontend stack
save_frontend_state() {
  echo "$1" > "$FRONTEND_STATE_FILE"
  log "Active frontend stack saved: $1"
}

# Initialize first-time deployment
initialize_if_needed() {
  local target=$1

  if [ "$target" = "backend" ] || [ "$target" = "all" ]; then
    local active_backend=$(get_active_backend_stack)
    if [ "$active_backend" = "none" ]; then
      if is_container_running "bomapro-backend-blue"; then
        warn "Found running bomapro-backend-blue container, setting it as active"
        save_backend_state "blue"
      elif is_container_running "bomapro-backend-green"; then
        warn "Found running bomapro-backend-green container, setting it as active"
        save_backend_state "green"
      else
        info "First-time backend deployment detected"
      fi
    fi
  fi

  if [ "$target" = "frontend" ] || [ "$target" = "all" ]; then
    local active_frontend=$(get_active_frontend_stack)
    if [ "$active_frontend" = "none" ]; then
      if is_container_running "bomapro-frontend-blue"; then
        warn "Found running bomapro-frontend-blue container, setting it as active"
        save_frontend_state "blue"
      elif is_container_running "bomapro-frontend-green"; then
        warn "Found running bomapro-frontend-green container, setting it as active"
        save_frontend_state "green"
      else
        info "First-time frontend deployment detected"
      fi
    fi
  fi
}

# Deploy function
deploy() {
  local target=${1:-all}

  initialize_if_needed "$target"

  local active_backend=$(get_active_backend_stack)
  local active_frontend=$(get_active_frontend_stack)

  echo ""
  echo "=============================================="
  echo "  Bomapro - Blue/Green Deploy"
  echo "=============================================="
  echo "  Target:               $target"
  echo "  Active backend stack: $active_backend"
  echo "  Active frontend stack: $active_frontend"
  echo "=============================================="
  echo ""

  pull_images "$target"

  if [ "$target" = "all" ]; then
    deploy_all
  elif [ "$target" = "backend" ]; then
    deploy_backend_only
  elif [ "$target" = "frontend" ]; then
    deploy_frontend_only
  fi
}

# Deploy backend only
deploy_backend_only() {
  local active_backend=$(get_active_backend_stack)
  local new_backend=$(get_inactive_backend_stack)

  log "Deploying backend only: $active_backend -> $new_backend"

  start_stack "$new_backend" "backend"

  local backend_port=$(get_backend_port "$new_backend")
  if ! health_check "Backend" "$backend_port" "/health"; then
    error "Backend health check failed! Stopping new backend, keeping $active_backend active."
    stop_stack "$new_backend" "backend"
    exit 1
  fi

  switch_nginx_backend "$new_backend"
  stop_stack "$active_backend" "backend"
  save_backend_state "$new_backend"

  echo ""
  log "Backend deploy complete! Active backend stack: $new_backend"
  log "Frontend stack remains: $(get_active_frontend_stack)"
  echo ""
}

# Deploy frontend only
deploy_frontend_only() {
  local active_frontend=$(get_active_frontend_stack)
  local new_frontend=$(get_inactive_frontend_stack)

  log "Deploying frontend only: $active_frontend -> $new_frontend"

  start_stack "$new_frontend" "frontend"

  local frontend_port=$(get_frontend_port "$new_frontend")
  if ! health_check "Frontend" "$frontend_port" "/health"; then
    error "Frontend health check failed! Stopping new frontend, keeping $active_frontend active."
    stop_stack "$new_frontend" "frontend"
    exit 1
  fi

  switch_nginx_frontend "$new_frontend"
  stop_stack "$active_frontend" "frontend"
  save_frontend_state "$new_frontend"

  echo ""
  log "Frontend deploy complete! Active frontend stack: $new_frontend"
  log "Backend stack remains: $(get_active_backend_stack)"
  echo ""
}

# Deploy both services
deploy_all() {
  local active_backend=$(get_active_backend_stack)
  local active_frontend=$(get_active_frontend_stack)
  local new_backend=$(get_inactive_backend_stack)
  local new_frontend=$(get_inactive_frontend_stack)

  log "Deploying all services: backend($active_backend -> $new_backend), frontend($active_frontend -> $new_frontend)"

  start_stack "$new_backend" "backend"
  start_stack "$new_frontend" "frontend"

  local health_ok=true
  local backend_port=$(get_backend_port "$new_backend")
  local frontend_port=$(get_frontend_port "$new_frontend")

  if ! health_check "Backend" "$backend_port" "/health"; then
    health_ok=false
  fi

  if ! health_check "Frontend" "$frontend_port" "/health"; then
    health_ok=false
  fi

  if [ "$health_ok" = false ]; then
    error "Health checks failed! Stopping new stack, keeping current stacks active."
    stop_stack "$new_backend" "backend"
    stop_stack "$new_frontend" "frontend"
    exit 1
  fi

  switch_nginx_both "$new_backend" "$new_frontend"

  stop_stack "$active_backend" "backend"
  stop_stack "$active_frontend" "frontend"

  save_backend_state "$new_backend"
  save_frontend_state "$new_frontend"

  echo ""
  log "Full deploy complete! Active stacks - Backend: $new_backend, Frontend: $new_frontend"
  echo ""
}

# Rollback function
rollback() {
  local active_backend=$(get_active_backend_stack)
  local active_frontend=$(get_active_frontend_stack)
  local previous_backend=$(get_inactive_backend_stack)
  local previous_frontend=$(get_inactive_frontend_stack)

  echo ""
  warn "Rolling back all services..."
  warn "Backend: $active_backend -> $previous_backend"
  warn "Frontend: $active_frontend -> $previous_frontend"

  start_stack "$previous_backend" "backend"
  start_stack "$previous_frontend" "frontend"

  local backend_port=$(get_backend_port "$previous_backend")
  local frontend_port=$(get_frontend_port "$previous_frontend")

  if health_check "Backend" "$backend_port" "/health" && health_check "Frontend" "$frontend_port" "/health"; then
    switch_nginx_both "$previous_backend" "$previous_frontend"
    stop_stack "$active_backend" "backend"
    stop_stack "$active_frontend" "frontend"
    save_backend_state "$previous_backend"
    save_frontend_state "$previous_frontend"
    log "Rollback complete! Active stacks - Backend: $previous_backend, Frontend: $previous_frontend"
  else
    error "Rollback failed! Previous containers are unhealthy."
    stop_stack "$previous_backend" "backend"
    stop_stack "$previous_frontend" "frontend"
    exit 1
  fi
}

# Run database seed in active backend container
seed_db() {
  local active_backend=$(get_active_backend_stack)
  if [ "$active_backend" = "none" ]; then
    error "No active backend stack running. Deploy backend first."
    exit 1
  fi
  log "Running production seed in bomapro-backend-$active_backend..."
  docker exec "bomapro-backend-$active_backend" node seed-production.js
}

# Status function
status() {
  local active_backend=$(get_active_backend_stack)
  local active_frontend=$(get_active_frontend_stack)
  echo ""
  echo "=============================================="
  echo "  Bomapro - Deployment Status"
  echo "=============================================="
  echo "  Active backend stack:  $active_backend"
  echo "  Active frontend stack: $active_frontend"
  echo ""
  echo "  Containers:"
  docker ps --format "  {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep bomapro || echo "  No bomapro containers running"
  echo ""
  echo "  Nginx Upstreams:"
  if [ -f "$NGINX_UPSTREAM_DIR/bomapro-backend-upstream.conf" ]; then
    grep "server 127.0.0.1" "$NGINX_UPSTREAM_DIR/bomapro-backend-upstream.conf" | sed 's/^/  Backend:  /'
  else
    echo "  Backend:  Not configured"
  fi
  if [ -f "$NGINX_UPSTREAM_DIR/bomapro-frontend-upstream.conf" ]; then
    grep "server 127.0.0.1" "$NGINX_UPSTREAM_DIR/bomapro-frontend-upstream.conf" | sed 's/^/  Frontend: /'
  else
    echo "  Frontend: Not configured"
  fi
  echo ""
  echo "=============================================="
}

# Main
case "${1:-}" in
  backend)
    deploy "backend"
    ;;
  frontend)
    deploy "frontend"
    ;;
  seed)
    seed_db
    ;;
  rollback)
    rollback
    ;;
  status)
    status
    ;;
  *)
    deploy "all"
    ;;
esac

