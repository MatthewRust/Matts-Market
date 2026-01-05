# Matt's Market - Render Deployment Guide

## Overview
This guide explains how to deploy Matt's Market to Render.com with PostgreSQL database, Node.js backend, and React frontend.

## Architecture
- **Frontend**: React + Vite (Static Site)
- **Backend**: Node.js + Express API (Web Service)
- **Database**: PostgreSQL (Managed Database)

---

## Prerequisites
1. GitHub repository with your code pushed
2. Render.com account (free tier available)
3. Project environment variables ready

---

## Deployment Steps

### 1. Create PostgreSQL Database

1. Go to Render Dashboard → **New** → **PostgreSQL**
2. Configure:
   - **Name**: `matts-market-db`
   - **Database**: `appdb`
   - **User**: `myuser` (or your choice)
   - **Region**: Choose closest to your users
   - **Plan**: Free or Starter
3. Click **Create Database**
4. **Save the connection details** (Internal Database URL, External Database URL, etc.)

---

### 2. Deploy Backend (Node.js API)

1. Go to Render Dashboard → **New** → **Web Service**
2. Connect your GitHub repository
3. Configure:
   - **Name**: `matts-market-api`
   - **Region**: Same as database
   - **Branch**: `main` (or your default branch)
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free or Starter

4. **Environment Variables** (click "Advanced" → "Add Environment Variable"):
   ```
   NODE_ENV=production
   PORT=8080
   PGHOST=<your-postgres-internal-host>
   PGUSER=myuser
   PGPASSWORD=<your-postgres-password>
   PGDATABASE=appdb
   PGPORT=5432
   CORS_ORIGIN=https://matts-market.onrender.com
   ```
   
   **CRITICAL**: 
   - Get `PGHOST`, `PGPASSWORD` from your PostgreSQL dashboard (use **Internal Database URL** components)
   - `CORS_ORIGIN` must match your frontend URL EXACTLY (no trailing slash)
   - For multiple origins, use comma-separated: `https://matts-market.onrender.com,https://www.matts-market.com`
   - After deploying frontend, come back and update `CORS_ORIGIN` with the actual frontend URL

5. Click **Create Web Service**
6. Wait for deployment (first deploy takes 3-5 minutes)
7. **Save your backend URL**: `https://matts-market-api.onrender.com`

---

### 3. Deploy Frontend (React Static Site)

1. Go to Render Dashboard → **New** → **Static Site**
2. Connect your GitHub repository
3. Configure:
   - **Name**: `matts-market-frontend`
   - **Branch**: `main`
   - **Root Directory**: `client`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`

4. **Environment Variables**:
   ```
   VITE_API_URL=https://matts-market-api.onrender.com/api
   ```

5. Click **Create Static Site**
6. Wait for build and deployment
7. **Save your frontend URL**: `https://matts-market-frontend.onrender.com`

---

### 4. Update Backend CORS

1. Go back to your **Backend Web Service** on Render
2. Go to **Environment** tab
3. Update `CORS_ORIGIN` environment variable:
   ```
   CORS_ORIGIN=https://matts-market-frontend.onrender.com
   ```
4. Save changes (this will trigger a redeploy)

---

## Post-Deployment Checklist

- [ ] Database is running and accessible
- [ ] Backend API is running (`https://your-api.onrender.com` returns "Node.js Server is Running!")
- [ ] Frontend loads successfully
- [ ] Can register a new user
- [ ] Can create an event
- [ ] Can buy/sell shares
- [ ] Graphs display correctly
- [ ] Admin dashboard works (for admin users)

---

## Environment Variables Reference

### Backend (.env)
```bash
NODE_ENV=production
PORT=8080
PGHOST=<internal-postgres-host>
PGUSER=myuser
PGPASSWORD=<your-password>
PGDATABASE=appdb
PGPORT=5432
CORS_ORIGIN=https://your-frontend.onrender.com
```

### Frontend (.env)
```bash
VITE_API_URL=https://your-backend.onrender.com/api
```

---

## Troubleshooting

### Backend won't connect to database
- Verify `PGHOST` uses the **Internal** hostname (e.g., `dpg-xxxxx`)
- Check `PGPASSWORD` is correct
- Ensure PostgreSQL is in the same region as backend

### CORS errors in browser
**Error**: `Access to XMLHttpRequest has been blocked by CORS policy`

**Solution**:
1. Go to your backend service on Render → **Environment** tab
2. Check `CORS_ORIGIN` environment variable:
   - Must be EXACTLY `https://matts-market.onrender.com` (your actual frontend URL)
   - No trailing slash
   - Must include `https://`
3. After changing, service will auto-redeploy (wait 2-3 minutes)
4. Clear browser cache and try again
5. Check backend logs for "CORS blocked origin" warnings

**Still not working?**
- Verify frontend `VITE_API_URL` in frontend environment variables
- Check that backend is running (visit `https://your-api.onrender.com` - should show "Node.js Server is Running!")
- Look at browser console Network tab → click failed request → check Response headers

### Frontend shows "Network Error"
- Check `VITE_API_URL` in frontend environment variables
- Verify backend is running and accessible
- Check browser console for specific error messages

### Database initialization fails
- Backend automatically runs schema initialization on first connection
- Check backend logs in Render dashboard for specific errors
- Database migrations run automatically via `initializeSchema()`

---

## Free Tier Limitations

**Render Free Tier:**
- Services spin down after 15 minutes of inactivity
- Cold starts take 30-50 seconds
- 750 hours/month of runtime
- PostgreSQL: 1GB storage, 97 hours/month uptime

**Upgrading**: For production use, consider Starter ($7/month) or higher plans for:
- No spin-down
- Better performance
- More database storage
- Custom domains

---

## Custom Domain (Optional)

### Frontend
1. Go to your Static Site → **Settings** → **Custom Domain**
2. Add your domain (e.g., `mattsmarket.com`)
3. Configure DNS with provided records

### Backend
1. Go to your Web Service → **Settings** → **Custom Domain**
2. Add API subdomain (e.g., `api.mattsmarket.com`)
3. Update frontend `VITE_API_URL` to use new domain
4. Update backend `CORS_ORIGIN` to allow new frontend domain

---

## Monitoring & Logs

- **View Logs**: Each service has a "Logs" tab in Render dashboard
- **Events Tab**: Shows deployments and service events
- **Metrics**: Available on paid plans

---

## Local Development

To run locally after deployment:

1. **Backend**: `cd server && npm install && npm run dev`
2. **Frontend**: `cd client && npm install && npm run dev`
3. Use `.env` files with localhost values (see `.env.example` files)

---

## Support

- **Render Docs**: https://render.com/docs
- **Project Issues**: Check GitHub repository issues
