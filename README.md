# Bomapro

Rental Management System for the Kenyan Market.

## Prerequisites

- [Node.js](https://nodejs.org/) >= 18
- [pnpm](https://pnpm.io/installation)

## Quick Start

All commands are run from the **project root** (`bomapro-root/`).

```bash
# 1. Install all dependencies (both frontend & backend)
pnpm install

# 2. Approve build scripts for native dependencies (required once)
pnpm approve-builds

# 3. Copy and configure environment variables
cp bomapro-backend/.env.example bomapro-backend/.env
# Then edit bomapro-backend/.env with your values (MongoDB URI, JWT secret, etc.)

# 4a. Start both backend & frontend together (recommended)
pnpm run dev

# 4b. Or start each in a separate terminal:
pnpm run dev:backend    # NestJS API → http://localhost:3400
pnpm run dev:frontend   # Angular SPA → http://localhost:4400
```

## Commands

| Command | Description |
|---------|-------------|
| `pnpm run dev` | Start both backend and frontend concurrently |
| `pnpm run dev:backend` | Start backend with hot-reload |
| `pnpm run dev:frontend` | Start frontend dev server on port 4400 |
| `pnpm run build:backend` | Build backend for production |
| `pnpm run build:frontend` | Build frontend for production |
| `pnpm run test:backend` | Run backend tests |
| `pnpm run test:frontend` | Run frontend tests |

### Seeding (Backend)

```bash
pnpm --filter bomapro-backend run seed:super-admin
pnpm --filter bomapro-backend run seed:tenant
pnpm --filter bomapro-backend run seed:production
```

## Project Structure

```
bomapro-root/
├── bomapro-backend/     # NestJS API (port 3400)
├── bomapro-frontend/    # Angular SPA (port 4400)
├── package.json         # Root scripts
└── pnpm-workspace.yaml
```
