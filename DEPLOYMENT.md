# Deployment Guide

## Recommended setup

- Frontend: Vercel
- Backend: Render
- Database: Render PostgreSQL or Railway PostgreSQL

Render is the better fit here because this backend is a long-running Express + Socket.IO service, and Render handles persistent Node web services and health checks very cleanly. Railway would also work, but Render is the simpler default for this codebase.

## Frontend on Vercel

Project settings:

- Root Directory: `etms-frontend2`
- Framework Preset: `Vite`
- Build Command: `npm run build`
- Output Directory: `build`

Environment variables on Vercel:

- `VITE_API_URL=https://your-render-service.onrender.com/api`
- `VITE_GOOGLE_MAPS_API_KEY=...`
- `VITE_RAZORPAY_KEY_ID=...`
- `VITE_STRIPE_PUBLISHABLE_KEY=...` if you use Stripe

Notes:

- `etms-frontend2/vercel.json` adds SPA rewrites so React Router routes work on refresh.
- After your first Vercel deploy, copy the final Vercel domain and set it as `FRONTEND_URL` in Render.

## Backend on Render

There is now a root `render.yaml` that can be used with Render Blueprint deploys.

Service settings:

- Root Directory: `etms-backend`
- Build Command: `npm install`
- Start Command: `npm start`
- Health Check Path: `/api/health`

Required backend environment variables:

- `NODE_ENV=production`
- `FRONTEND_URL=https://your-vercel-app.vercel.app`
- `DATABASE_URL=...`
- `DB_SSL=true`
- `JWT_SECRET=...`
- `GOOGLE_CLIENT_ID=...` if using Google login
- `GOOGLE_CLIENT_SECRET=...` if using Google login
- `GOOGLE_CALLBACK_URL=https://your-render-service.onrender.com/api/auth/google/callback`
- `SMTP_HOST=...`
- `SMTP_PORT=...`
- `SMTP_SECURE=...`
- `SMTP_USER=...`
- `SMTP_PASS=...`
- `MAIL_FROM=...`
- `RAZORPAY_KEY_ID=...` if using Razorpay
- `RAZORPAY_KEY_SECRET=...` if using Razorpay
- `GOOGLE_MAPS_API_KEY=...` if backend geocoding/routes depend on it

## OAuth and external providers

If you use Google OAuth, update your Google Cloud OAuth client:

- Authorized JavaScript origin: your Vercel frontend URL
- Authorized redirect URI: `https://your-render-service.onrender.com/api/auth/google/callback`

If you use Razorpay or Stripe webhooks, point them to your backend URL, not Vercel.

## Deploy order

1. Create the backend database and deploy the backend on Render.
2. Copy the Render backend URL into Vercel as `VITE_API_URL`.
3. Deploy the frontend on Vercel.
4. Copy the Vercel frontend URL into Render as `FRONTEND_URL`.
5. Update Google OAuth and payment provider callback URLs.
