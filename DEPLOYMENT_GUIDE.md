# 🚀 Deployment Guide

## ✅ Frontend (Vercel) - COMPLETED
- **URL**: https://my-apps-3y9m7qbfx-harshs-projects-d92d1860.vercel.app
- **Status**: ✅ Deployed and working

## 🔧 Backend (Railway) - IN PROGRESS

### Step 1: Railway Configuration
1. Go to: https://railway.com/project/e98b2b0d-306d-4649-9ce5-cb6542f89527
2. Delete existing service (if any)
3. Create new service:
   - Repository: `https://github.com/Harsh47579/new1`
   - **Root Directory**: `server` ← IMPORTANT
   - Build Command: (leave empty)
   - Start Command: `npm start`

### Step 2: Environment Variables
Add these in Railway dashboard:
```
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/jharkhand-civic
JWT_SECRET=your-super-secret-jwt-key-here
CLIENT_URL=https://my-apps-3y9m7qbfx-harshs-projects-d92d1860.vercel.app
```

### Step 3: Update Frontend API URL
Once Railway gives you the backend URL (like `https://xxx.railway.app`):
1. Update `client/.env` file:
   ```
   REACT_APP_API_URL=https://your-railway-backend-url.railway.app
   ```
2. Redeploy frontend on Vercel

## 📁 Project Structure
```
new1/
├── client/          # React frontend (Vercel)
├── server/          # Node.js backend (Railway)
│   ├── routes/      # API routes
│   ├── models/      # Database models
│   └── index.js     # Main server file
└── ml-service/      # ML models
```

## 🔗 URLs
- **Frontend**: https://my-apps-3y9m7qbfx-harshs-projects-d92d1860.vercel.app
- **Backend**: https://your-railway-backend-url.railway.app (after Railway deployment)
- **GitHub**: https://github.com/Harsh47579/new1
