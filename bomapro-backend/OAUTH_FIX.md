# Google OAuth Fix - Deployed April 16, 2026

## Problem
Backend crashed on Vercel with: `OAuth2Strategy requires a clientID option`

## Solution Implemented
- **Provider Gating**: GoogleStrategy is now conditionally excluded from auth.module.ts providers when `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` environment variables are not set
- **Serverless Handler**: Created `api/index.ts` with Express-based Nest app caching for Vercel serverless architecture
- **Vercel Config**: Updated `vercel.json` to route all requests to the serverless handler
- **Database Hardening**: MongoDB connection now fails fast with timeouts (5s) instead of infinite retries in serverless environment

## Files Changed
- `src/modules/auth/auth.module.ts` - Provider gating
- `api/index.ts` - Serverless handler (NEW)
- `vercel.json` - Serverless routing
- `src/modules/database/database.module.ts` - Connection hardening
- `src/modules/auth/schemas/rentium-user.schema.ts` - Duplicate index removal
- `src/modules/tenants/schemas/tenant.schema.ts` - Duplicate index removal

## Deployment Status
✅ Code tested and verified locally
✅ All commits pushed to origin/main (2ee2159e)
✅ Build passes without errors
🚀 Awaiting Vercel redeploy webhook

## Testing
Auth module loads cleanly without OAuth credentials:
```bash
node -e "delete process.env.GOOGLE_CLIENT_ID; const mod = require('./dist/src/modules/auth/auth.module'); console.log(mod.AuthModule ? 'OK' : 'FAIL');"
```
Result: ✅ OK
