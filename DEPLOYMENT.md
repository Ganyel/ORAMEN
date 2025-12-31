# ORAMEN Deployment Guide

This guide covers deploying ORAMEN full-stack application to production.

## Architecture Overview

- **Frontend**: React (Vite) - Static hosting (Vercel/Netlify/Cloudflare Pages)
- **Backend**: Node.js (Express) - Cloud hosting (Railway/Render/Fly.io)
- **Database**: MySQL - Managed database (PlanetScale/Railway/Aiven)
- **Image Storage**: Backend uploads folder (consider cloud storage for production)

---

## Step 1: Database Setup (MySQL)

### Option A: PlanetScale (Recommended - Free Tier)
1. Create account at https://planetscale.com
2. Create new database named `oramen_db`
3. Get connection credentials from dashboard
4. Run schema: Import `server/database/schema.sql`

### Option B: Railway MySQL
1. Create project at https://railway.app
2. Add MySQL plugin
3. Copy connection credentials
4. Run schema via MySQL client

### Option C: Aiven MySQL
1. Create account at https://aiven.io
2. Create MySQL service
3. Download SSL certificate if required
4. Run schema

### Database Schema
Run the SQL schema file located at `server/database/schema.sql` to create all tables.

---

## Step 2: Backend Deployment

### Option A: Railway (Recommended)

1. **Connect Repository**
   ```bash
   # Push code to GitHub first
   git add .
   git commit -m "Prepare for deployment"
   git push origin master
   ```

2. **Create Railway Project**
   - Go to https://railway.app
   - Click "New Project" > "Deploy from GitHub repo"
   - Select your repository
   - Set root directory to `/server`

3. **Configure Environment Variables**
   Add these in Railway dashboard:
   ```
   NODE_ENV=production
   PORT=5000
   DB_HOST=<from-database-provider>
   DB_USER=<from-database-provider>
   DB_PASSWORD=<from-database-provider>
   DB_NAME=oramen_db
   MIDTRANS_SERVER_KEY=<your-midtrans-server-key>
   MIDTRANS_CLIENT_KEY=<your-midtrans-client-key>
   MIDTRANS_IS_PRODUCTION=false
   BACKEND_URL=https://<your-railway-app>.up.railway.app
   FRONTEND_URL=https://<your-vercel-app>.vercel.app
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=<secure-password>
   JWT_SECRET=<random-secure-string>
   ```

4. **Deploy**
   - Railway auto-deploys on push
   - Check logs for errors
   - Test: `https://<your-app>.up.railway.app/api/health`

### Option B: Render

1. Create account at https://render.com
2. New Web Service > Connect GitHub
3. Settings:
   - Root Directory: `server`
   - Build Command: `npm install`
   - Start Command: `node index.js`
4. Add environment variables
5. Deploy

### Option C: Fly.io

1. Install flyctl: https://fly.io/docs/hands-on/install-flyctl/
2. Create `fly.toml` in `/server`:
   ```toml
   app = "oramen-backend"
   primary_region = "sin"
   
   [build]
     builder = "heroku/buildpacks:20"
   
   [env]
     PORT = "8080"
     NODE_ENV = "production"
   
   [http_service]
     internal_port = 8080
     force_https = true
   ```
3. Deploy: `fly deploy`
4. Set secrets: `fly secrets set DB_HOST=... DB_USER=... etc`

---

## Step 3: Frontend Deployment

### Option A: Vercel (Recommended)

1. **Prepare Environment**
   Create `.env.production` in root:
   ```
   VITE_API_BASE_URL=https://<your-backend-url>/api
   ```

2. **Deploy to Vercel**
   ```bash
   npm install -g vercel
   vercel login
   vercel
   ```
   
   Or connect GitHub repo at https://vercel.com

3. **Configure in Vercel Dashboard**
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Environment Variables:
     ```
     VITE_API_BASE_URL=https://<backend-url>/api
     ```

### Option B: Netlify

1. Go to https://netlify.com
2. Connect GitHub repository
3. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. Add environment variable:
   ```
   VITE_API_BASE_URL=https://<backend-url>/api
   ```

### Option C: Cloudflare Pages

1. Go to https://pages.cloudflare.com
2. Connect GitHub
3. Build settings:
   - Build command: `npm run build`
   - Build output: `dist`
4. Add environment variable in settings

---

## Step 4: Midtrans Configuration

### For Sandbox Testing (Recommended First)

1. Login to https://dashboard.sandbox.midtrans.com
2. Settings > Access Keys
3. Copy Server Key (starts with `SB-Mid-server-`)
4. Copy Client Key (starts with `SB-Mid-client-`)
5. Update backend env: `MIDTRANS_IS_PRODUCTION=false`

### Update index.html for Dynamic Client Key

The Midtrans Snap.js in `index.html` needs the client key. For sandbox:
```html
<script src="https://app.sandbox.midtrans.com/snap/snap.js" data-client-key="SB-Mid-client-XXXX"></script>
```

For production:
```html
<script src="https://app.midtrans.com/snap/snap.js" data-client-key="Mid-client-XXXX"></script>
```

### Configure Notification URL

In Midtrans Dashboard:
1. Settings > Configuration
2. Payment Notification URL: `https://<backend-url>/api/payment-notification`
3. Finish Redirect URL: `https://<frontend-url>/payment-finish`

---

## Step 5: Image Upload Handling

### Current Setup (Filesystem)
Images are stored in `server/uploads/`. This works but has limitations:
- Files may be lost on redeploy (depending on hosting)
- No CDN

### Recommended: Cloud Storage (Optional Upgrade)

For production, consider:
- **Cloudinary**: Easy setup, free tier
- **AWS S3**: More control, pay-as-you-go
- **Uploadthing**: Simple, good free tier

---

## Step 6: Post-Deployment Checklist

### Backend Verification
```bash
# Health check
curl https://<backend-url>/api/health
# Expected: {"status":"ok","message":"Server is running"}

# Menu endpoint
curl https://<backend-url>/api/menu
# Expected: {"success":true,"data":[...]}
```

### Frontend Verification
1. Open frontend URL
2. Check menu loads (Network tab: GET /api/menu)
3. Check images display correctly
4. Test order flow:
   - Add item to cart
   - Go to payment
   - Test Cash payment (no Midtrans)
   - Test QRIS payment (Midtrans popup should appear)

### Database Verification
- Ensure tables exist
- Add sample menu items via Admin panel
- Verify data persists

---

## Environment Variables Summary

### Backend (.env)
| Variable | Description | Example |
|----------|-------------|---------|
| NODE_ENV | Environment | production |
| PORT | Server port | 5000 |
| DB_HOST | MySQL host | db.example.com |
| DB_USER | MySQL user | oramen_user |
| DB_PASSWORD | MySQL password | ******* |
| DB_NAME | Database name | oramen_db |
| MIDTRANS_SERVER_KEY | Midtrans server key | SB-Mid-server-xxx |
| MIDTRANS_CLIENT_KEY | Midtrans client key | SB-Mid-client-xxx |
| MIDTRANS_IS_PRODUCTION | Use production | false |
| BACKEND_URL | Public backend URL | https://api.oramen.com |
| FRONTEND_URL | Public frontend URL | https://oramen.com |

### Frontend (.env)
| Variable | Description | Example |
|----------|-------------|---------|
| VITE_API_BASE_URL | Backend API URL | https://api.oramen.com/api |

---

## Troubleshooting

### CORS Errors
- Check `FRONTEND_URL` env variable is set correctly
- Ensure no trailing slash

### Database Connection Failed
- Verify credentials
- Check if IP whitelist is needed
- Ensure SSL is configured if required

### Midtrans Not Working
- Verify keys match sandbox/production mode
- Check console for errors
- Ensure notification URL is accessible

### Images Not Loading
- Check `BACKEND_URL` is set
- Verify uploads folder has proper permissions
- Check image URLs in database

---

## Quick Deploy Commands

### Railway + Vercel
```bash
# Backend (in /server)
railway login
railway init
railway up

# Frontend (in root)
vercel --prod
```

### Get deployed URLs
- Railway: Dashboard > Deployments > View URL
- Vercel: Dashboard > Project > Visit

---

## Cost Estimate (Free Tiers)

| Service | Free Tier |
|---------|-----------|
| PlanetScale | 5GB storage, 1B row reads/mo |
| Railway | $5 free credit/month |
| Vercel | 100GB bandwidth/month |
| Midtrans Sandbox | Free (testing only) |

**Total: $0/month** for small-scale deployment
