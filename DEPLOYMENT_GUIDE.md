# Deployment Guide

This document describes how to deploy Bomapro (Backend & Frontend) to Vercel.

---

## 1. Prerequisites
- [Vercel CLI](https://vercel.com/cli) installed (`npm install -g vercel`)
- MongoDB Atlas cluster
- Node.js 20+

---

## 2. Environment Variables

Configure these variables in your **Vercel Dashboard** under **Project Settings > Environment Variables**:

### Backend (`bomapro-backend`)
| Variable | Description | Example |
| :--- | :--- | :--- |
| `MONGODB_URI` | MongoDB Atlas Connection String | `mongodb+srv://<user>:<password>@cluster0.example.mongodb.net/bomapro?retryWrites=true&w=majority` |
| `JWT_SECRET` | Secret key for auth tokens | `your-jwt-secret` |
| `TENANT_PORTAL_JWT_SECRET` | Secret key for tenant portal | `your-portal-secret` |
| `FRONTEND_URL` | Frontend domain | `https://bomapro.vercel.app` |
| `PORT` | API Server Port | `3400` |
| `SMTP_HOST` | Email SMTP Server | `smtp.gmail.com` |
| `SMTP_PORT` | Email SMTP Port | `587` |
| `SMTP_USER` | Email sender address | `noreply@example.com` |
| `SMTP_PASS` | SMTP application password | `your-app-password` |

### Frontend (`bomapro-frontend`)
Configured in `src/environments/environment.prod.ts` pointing to the backend API:
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://bomapro-backend-beta.vercel.app/api',
};
```

---

## 3. Deployment Commands

### Backend Deployment
```bash
cd bomapro-backend
npm run build
npx vercel --prod
```

### Frontend Deployment
```bash
cd bomapro-frontend
npm run build
npx vercel --prod
```
