# Railway Deployment Guide for ORAMEN Backend

## Pre-Deployment Checklist

Your backend is already configured correctly:
- [x] Server listens on `process.env.PORT`
- [x] App binds to `0.0.0.0`
- [x] CORS uses `FRONTEND_URL` from env
- [x] No hardcoded localhost in production code
- [x] Database uses environment variables

---

## Step 1: Push Code to GitHub

```bash
# Make sure all changes are committed
git add .
git commit -m "Prepare for Railway deployment"
git push origin master
```

---

## Step 2: Create Railway Account & Project

1. Go to https://railway.app
2. Sign up/Login with GitHub
3. Click **"New Project"**
4. Select **"Deploy from GitHub repo"**
5. Authorize Railway to access your repository
6. Select your **oramen** repository

---

## Step 3: Configure Backend Service

### 3.1 Set Root Directory
1. Click on your deployed service
2. Go to **Settings** tab
3. Under **Source**, set:
   - **Root Directory**: `/server`
   - **Watch Paths**: `/server/**`

### 3.2 Set Build & Start Commands
In **Settings** > **Deploy**:
- **Build Command**: `npm install`
- **Start Command**: `npm start`

---

## Step 4: Add MySQL Database

### 4.1 Add MySQL Service
1. In your Railway project, click **"+ New"**
2. Select **"Database"**
3. Choose **"MySQL"**
4. Wait for deployment (1-2 minutes)

### 4.2 Get Database Credentials
1. Click on the MySQL service
2. Go to **Variables** tab
3. Copy these values:
   - `MYSQL_HOST` → use for `DB_HOST`
   - `MYSQL_USER` → use for `DB_USER`
   - `MYSQL_PASSWORD` → use for `DB_PASSWORD`
   - `MYSQL_DATABASE` → use for `DB_NAME`

Or use the **Connection URL** format:
```
mysql://user:password@host:port/database
```

---

## Step 5: Configure Environment Variables

### 5.1 Go to Backend Service Variables
1. Click on your backend service (not MySQL)
2. Go to **Variables** tab
3. Click **"+ New Variable"** or **"RAW Editor"**

### 5.2 Add These Variables

```env
# Node Environment
NODE_ENV=production
PORT=5000

# Database (copy from MySQL service)
DB_HOST=${{MySQL.MYSQL_HOST}}
DB_USER=${{MySQL.MYSQL_USER}}
DB_PASSWORD=${{MySQL.MYSQL_PASSWORD}}
DB_NAME=${{MySQL.MYSQL_DATABASE}}

# Midtrans SANDBOX Keys (for testing)
MIDTRANS_SERVER_KEY=SB-Mid-server-YOUR_SANDBOX_SERVER_KEY
MIDTRANS_CLIENT_KEY=SB-Mid-client-YOUR_SANDBOX_CLIENT_KEY
MIDTRANS_IS_PRODUCTION=false

# URLs (update after deployment)
BACKEND_URL=https://your-app.up.railway.app
FRONTEND_URL=https://your-frontend.vercel.app

# Security
JWT_SECRET=generate_a_random_32_char_string_here
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_admin_password
```

### 5.3 Using Railway Variable References
Railway allows referencing other services' variables:
- `${{MySQL.MYSQL_HOST}}` - References MySQL host
- `${{MySQL.MYSQL_USER}}` - References MySQL user
- etc.

**OR** manually copy values from MySQL service.

---

## Step 6: Initialize Database Schema

### Option A: Using Railway CLI (Recommended)

1. Install Railway CLI:
```bash
npm install -g @railway/cli
```

2. Login and link project:
```bash
railway login
railway link
```

3. Connect to MySQL and run schema:
```bash
railway connect MySQL
```

4. In MySQL shell, paste the contents of `server/database/schema.sql`

### Option B: Using External MySQL Client

1. Get connection details from Railway MySQL service:
   - Host: `xxx.railway.app`
   - Port: `xxxx`
   - User: from `MYSQL_USER`
   - Password: from `MYSQL_PASSWORD`
   - Database: from `MYSQL_DATABASE`

2. Connect using MySQL Workbench, DBeaver, or command line:
```bash
mysql -h HOST -P PORT -u USER -p DATABASE < server/database/schema.sql
```

### Option C: Using Railway MySQL Plugin UI

1. Click on MySQL service
2. Go to **Data** tab
3. Click **"Query"**
4. Paste schema SQL and execute

---

## Step 7: Deploy & Get Public URL

### 7.1 Trigger Deployment
- Railway auto-deploys on git push
- Or click **"Deploy"** button manually

### 7.2 Generate Public URL
1. Click on backend service
2. Go to **Settings** tab
3. Under **Networking**, click **"Generate Domain"**
4. You'll get: `https://your-app-name.up.railway.app`

### 7.3 Update BACKEND_URL
1. Go to **Variables** tab
2. Update `BACKEND_URL` to your new Railway URL
3. Service will auto-redeploy

---

## Step 8: Verification Checklist

### 8.1 Health Check
```bash
curl https://your-app.up.railway.app/api/health
```
Expected response:
```json
{"status":"ok","message":"Server is running"}
```

### 8.2 Menu Endpoint
```bash
curl https://your-app.up.railway.app/api/menu
```
Expected response:
```json
{"success":true,"data":[]}
```
(Empty array is OK if no menu items added yet)

### 8.3 Check Logs
1. Click on backend service
2. Go to **Deployments** tab
3. Click on latest deployment
4. Check logs for:
   - `Server running on port 5000`
   - `Environment: production`
   - `Midtrans Mode: Sandbox`

---

## Environment Variables Reference

| Variable | Required | Example | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | Yes | `production` | Environment mode |
| `PORT` | Yes | `5000` | Server port (Railway provides) |
| `DB_HOST` | Yes | `mysql.railway.internal` | MySQL host |
| `DB_USER` | Yes | `root` | MySQL username |
| `DB_PASSWORD` | Yes | `abc123` | MySQL password |
| `DB_NAME` | Yes | `railway` | Database name |
| `MIDTRANS_SERVER_KEY` | Yes | `SB-Mid-server-xxx` | Midtrans server key |
| `MIDTRANS_CLIENT_KEY` | Yes | `SB-Mid-client-xxx` | Midtrans client key |
| `MIDTRANS_IS_PRODUCTION` | Yes | `false` | Use sandbox mode |
| `BACKEND_URL` | Yes | `https://x.up.railway.app` | Public backend URL |
| `FRONTEND_URL` | Yes | `https://x.vercel.app` | Frontend URL for CORS |
| `JWT_SECRET` | Yes | `random_string` | JWT signing secret |
| `ADMIN_USERNAME` | No | `admin` | Admin login username |
| `ADMIN_PASSWORD` | No | `secure123` | Admin login password |

---

## Common Issues & Fixes

### Issue 1: "Cannot connect to database"
**Cause**: Wrong database credentials or host
**Fix**: 
- Use Railway variable references: `${{MySQL.MYSQL_HOST}}`
- Or copy exact values from MySQL service

### Issue 2: "CORS error from frontend"
**Cause**: `FRONTEND_URL` not set or wrong
**Fix**:
- Set `FRONTEND_URL` to your Vercel URL (no trailing slash)
- Example: `https://oramen.vercel.app`

### Issue 3: "Midtrans authentication failed"
**Cause**: Using production keys with sandbox mode or vice versa
**Fix**:
- For sandbox: Keys start with `SB-Mid-`
- Set `MIDTRANS_IS_PRODUCTION=false`

### Issue 4: "Module not found"
**Cause**: Root directory not set to `/server`
**Fix**:
- Settings > Source > Root Directory: `/server`

### Issue 5: "Port already in use"
**Cause**: Hardcoded port
**Fix**: Already fixed - uses `process.env.PORT`

### Issue 6: "Image uploads not persisting"
**Cause**: Railway's ephemeral filesystem
**Fix**: 
- Use Railway Volume (Settings > Volumes > Mount)
- Or use cloud storage (Cloudinary/S3)

### Issue 7: "Application crashed on start"
**Cause**: Missing environment variables
**Fix**: Check all required env vars are set

---

## Midtrans Sandbox Setup

### Get Sandbox Keys
1. Go to https://dashboard.sandbox.midtrans.com
2. Login/Register
3. Settings > Access Keys
4. Copy:
   - Server Key: `SB-Mid-server-XXXXXXXXXXXX`
   - Client Key: `SB-Mid-client-XXXXXXXXXXXX`

### Configure Notification URL
1. In Midtrans Dashboard: Settings > Configuration
2. Set Payment Notification URL:
   ```
   https://your-app.up.railway.app/api/payment-notification
   ```
3. Set Finish Redirect URL:
   ```
   https://your-frontend.vercel.app/payment-finish
   ```

### Test Cards (Sandbox)
| Card Number | Result |
|-------------|--------|
| 4811 1111 1111 1114 | Success |
| 4911 1111 1111 1113 | Denied |
| 4411 1111 1111 1118 | Timeout |

CVV: Any 3 digits
Expiry: Any future date

---

## Quick Deploy Commands

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Initialize in project
cd /path/to/oramen
railway init

# 4. Link to existing project (if already created via web)
railway link

# 5. Deploy
railway up

# 6. Open deployed app
railway open

# 7. View logs
railway logs

# 8. Connect to MySQL
railway connect MySQL
```

---

## Final Verification Checklist

Before going live, verify:

- [ ] `/api/health` returns `{"status":"ok"}`
- [ ] `/api/menu` returns JSON (empty array OK)
- [ ] `/api/admin/stats` returns statistics
- [ ] Database tables created (6 tables)
- [ ] CORS allows frontend domain
- [ ] Midtrans sandbox keys configured
- [ ] `BACKEND_URL` matches Railway domain
- [ ] `FRONTEND_URL` matches Vercel domain
- [ ] Logs show "Server running" and "Sandbox" mode

---

## Estimated Costs

| Service | Free Tier | Paid |
|---------|-----------|------|
| Railway | $5/month credit | $0.000231/GB-hr |
| MySQL | Included | Included with Railway |

**Total**: ~$0-5/month for small apps

---

## Next Steps After Backend Deployment

1. Copy your Railway backend URL
2. Deploy frontend to Vercel with:
   ```
   VITE_API_BASE_URL=https://your-railway-app.up.railway.app/api
   ```
3. Update Railway's `FRONTEND_URL` to Vercel URL
4. Test full flow: Menu → Cart → Payment → Order
