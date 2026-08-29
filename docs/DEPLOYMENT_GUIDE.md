# 🚀 SmartShop Deployment Guide (Render & Vercel)

This document provides step-by-step instructions to deploy **SmartShop**:
- **Backend API** ➔ Deployed on **Render** (Free / Starter Web Service)
- **Customer Frontend** ➔ Deployed on **Vercel**
- **Admin POS Dashboard** ➔ Deployed on **Vercel**

---

## 1. Deploy Backend on Render

### Step 1.1: Create Web Service
1. Log in to [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** ➔ Select **Web Service**.
3. Connect your GitHub repository: `Ajitsingh57/SmartShop`.

### Step 1.2: Configure Build & Runtime Settings
Fill in the following fields:
- **Name**: `smartshop-backend` (or your preferred name)
- **Region**: Choose closest to you (e.g. *Singapore* or *Frankfurt*)
- **Branch**: `main`
- **Root Directory**: `backend` *(CRITICAL: Type `backend` here)*
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Instance Type**: `Free`

### Step 1.3: Set Environment Variables on Render
Under the **Environment Variables** tab, add the following key-value pairs:

| Variable Name | Description / Example Value |
|---|---|
| `MONGO_URI` | Your MongoDB Atlas connection string (`mongodb+srv://...`) |
| `JWT_SECRET` | Strong secret string (e.g. `smartshop_super_secret_jwt_key_2026`) |
| `CLOUDINARY_CLOUD_NAME` | Your Cloudinary Cloud Name |
| `CLOUDINARY_API_KEY` | Your Cloudinary API Key |
| `CLOUDINARY_API_SECRET` | Your Cloudinary API Secret |
| `RAZORPAY_KEY_ID` | Your Razorpay Key ID |
| `RAZORPAY_KEY_SECRET` | Your Razorpay Key Secret |
| `FRONTEND_URL` | *(Add after Frontend deployment, e.g. `https://smartshop-customer.vercel.app`)* |
| `ADMIN_URL` | *(Add after Admin deployment, e.g. `https://smartshop-admin.vercel.app`)* |

### Step 1.4: Health Check (Optional)
- **Health Check Path**: `/api/health`

Click **Create Web Service**. Wait 2-3 minutes for the build to finish.
Once deployed, copy your Render URL: e.g. `https://smartshop-backend.onrender.com`.

---

## 2. Deploy Customer Frontend on Vercel

1. Log in to [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **Add New...** ➔ **Project**.
3. Import your GitHub repository: `Ajitsingh57/SmartShop`.
4. Configure the project:
   - **Project Name**: `smartshop-customer`
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click **Edit** and choose `frontend` *(CRITICAL)*.
5. In **Environment Variables**, add:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://your-backend-app.onrender.com/api` *(Make sure to include `/api` at the end)*
6. Click **Deploy**.

---

## 3. Deploy Admin POS Dashboard on Vercel

1. In Vercel Dashboard, click **Add New...** ➔ **Project**.
2. Import the same repository: `Ajitsingh57/SmartShop`.
3. Configure the project:
   - **Project Name**: `smartshop-admin`
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click **Edit** and choose `admin` *(CRITICAL)*.
5. In **Environment Variables**, add:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://your-backend-app.onrender.com/api` *(Same Render URL with `/api`)*
6. Click **Deploy**.

---

## 4. Final Post-Deployment Step (CORS Update)

1. Copy your live **Customer Frontend URL** from Vercel (e.g. `https://smartshop-customer.vercel.app`).
2. Copy your live **Admin Dashboard URL** from Vercel (e.g. `https://smartshop-admin.vercel.app`).
3. Go back to **Render Dashboard** ➔ `smartshop-backend` ➔ **Environment**.
4. Update `FRONTEND_URL` and `ADMIN_URL` with these exact URLs.
5. Render will automatically re-deploy with full CORS protection.

---

## 🎉 Verification Checklist:
- [ ] Backend health check returns `{ "success": true, "status": "healthy" }` at `https://<backend-url>/api/health`.
- [ ] Customer frontend loads catalog and authentication without CORS errors.
- [ ] Admin dashboard logs in and accesses POS billing, customers, payments, and returns.
- [ ] Refreshing pages on Vercel does not trigger 404 errors (handled by `vercel.json` rewrites).
