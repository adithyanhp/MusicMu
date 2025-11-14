# 🔧 Vercel Deployment Fix Guide

## Issues Identified

1. **Module Import Errors** - Fixed ✅
2. **Frontend Using Port Numbers** - Needs Configuration ⚠️

## Fixed Issues

### 1. Module Resolution (COMPLETED ✅)

**Problem:** Vercel couldn't find `lib/youtube` module
```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module '/var/task/vercelhost(serverless)/backend/lib/youtube'
```

**Fix Applied:** Added `.js` extensions to all imports
- `../lib/youtube` → `../lib/youtube.js`
- Updated files:
  - `api/search.ts`
  - `api/track/[id].ts`
  - `api/track/[id]/full.ts`

**Why:** Node.js ESM requires explicit file extensions

### 2. Vercel Configuration (COMPLETED ✅)

**Updated:** `backend/vercel.json` to modern format
```json
{
  "functions": {
    "api/**/*.ts": {
      "runtime": "@vercel/node@3"
    }
  },
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/$1" }
  ]
}
```

## Required Manual Steps

### Step 1: Get Your Backend URL

After deploying the backend, Vercel will give you a URL like:
```
https://musicmu-backend-xyz.vercel.app
```

### Step 2: Update Frontend Configuration

**Option A: Using Environment Variables (Recommended)**

1. In Vercel Dashboard for **frontend** project:
   - Go to Settings → Environment Variables
   - Add: `VITE_API_URL` = `https://your-backend-url.vercel.app`
   - Save and redeploy

**Option B: Update vercel.json**

Edit `frontend/vercel.json`:
```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://YOUR-ACTUAL-BACKEND-URL.vercel.app/api/:path*"
    }
  ]
}
```

**Option C: Update .env.production**

Edit `frontend/.env.production`:
```bash
VITE_API_URL=https://YOUR-ACTUAL-BACKEND-URL.vercel.app
```

### Step 3: Redeploy

```bash
# Backend (if not already deployed)
cd backend
vercel --prod

# Note the URL, then update frontend config

# Frontend
cd ../frontend
vercel --prod
```

## Deployment Order

✅ **Correct Order:**
1. Deploy **backend** first
2. Get backend URL from Vercel
3. Update **frontend** config with backend URL
4. Deploy **frontend**

❌ **Wrong Order:**
- Deploying frontend first (no backend URL available)
- Using localhost URLs in production

## Testing Deployment

### Test Backend
```bash
curl https://your-backend.vercel.app/api/health
```

Expected response:
```json
{
  "status": "ok",
  "service": "MusicMu API",
  "timestamp": "2024-11-14T..."
}
```

### Test Frontend
1. Open: `https://your-frontend.vercel.app`
2. Open browser console (F12)
3. Check for API calls going to correct backend URL
4. Should NOT see `localhost:4001` in network tab

## Common Issues

### Issue: Frontend still using localhost

**Symptom:** Network tab shows calls to `http://localhost:4001`

**Fix:** 
1. Check `.env.production` has correct `VITE_API_URL`
2. Run `npm run build` locally to test
3. Redeploy to Vercel

### Issue: CORS errors

**Symptom:** Browser console shows CORS policy errors

**Fix:** 
- Backend already has CORS headers (`Access-Control-Allow-Origin: *`)
- If still happening, check backend is actually receiving requests
- Check browser Network tab for actual backend response

### Issue: 500 Internal Server Error

**Symptom:** All API calls fail with 500

**Fix:**
- Check Vercel function logs
- Most likely cause: Environment variable not set
- Go to backend project → Settings → Environment Variables
- Ensure all required vars are set

## Environment Variables Reference

### Backend (Vercel Dashboard)
```
NODE_ENV=production
(Add others as needed from .env.example)
```

### Frontend (Vercel Dashboard)
```
VITE_API_URL=https://your-backend-url.vercel.app
VITE_APP_NAME=MusicMu
VITE_APP_VERSION=1.0.0
```

## Quick Deploy Script

```bash
#!/bin/bash

# 1. Deploy backend
echo "📦 Deploying backend..."
cd backend
BACKEND_URL=$(vercel --prod --yes | grep -o 'https://[^[:space:]]*')
echo "✅ Backend deployed: $BACKEND_URL"

# 2. Update frontend env
echo "🔧 Updating frontend config..."
cd ../frontend
echo "VITE_API_URL=$BACKEND_URL" > .env.production
echo "VITE_APP_NAME=MusicMu" >> .env.production
echo "VITE_APP_VERSION=1.0.0" >> .env.production

# 3. Deploy frontend
echo "📦 Deploying frontend..."
vercel --prod --yes

echo "✅ Deployment complete!"
echo "Backend: $BACKEND_URL"
echo "Check your Vercel dashboard for frontend URL"
```

Save as `deploy-all.sh`, make executable: `chmod +x deploy-all.sh`

## Status

- ✅ Import errors fixed
- ✅ Vercel config updated
- ⚠️ **Manual action required:** Update frontend with actual backend URL
- ⚠️ **Then:** Redeploy frontend

