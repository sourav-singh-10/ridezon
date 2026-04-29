# Ridezon Deployment Guide

This project has two parts:

- `Client`: Next.js frontend
- `backend`: Express + Prisma API

The simplest hosting setup is:

- Frontend on Vercel
- Backend + PostgreSQL on Railway

## 1. Run locally first

Frontend:

```powershell
cd Client
copy .env.example .env.local
npm install
npm run dev
```

Backend:

```powershell
cd backend
copy .env.example .env
npm install
npx prisma generate
npx prisma db push
npm run dev
```

Local URLs:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:4000`

## 2. Create the database and backend on Railway

1. Push this project to your GitHub account.
2. Go to [Railway](https://railway.app/).
3. Create a new project.
4. Add a PostgreSQL service.
5. Add a service from GitHub and select this repository.
6. Set the Railway service root directory to `backend`.
7. Add these environment variables in Railway:

```env
DATABASE_URL=your-railway-postgres-connection-string
NODE_ENV=production
PORT=4000
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=7d
FRONTEND_URLS=https://your-frontend.vercel.app
```

8. Set the start/build behavior:

- Build command: `npm install && npx prisma generate && npm run build`
- Start command: `npx prisma db push && npm start`

9. Deploy and copy the public backend URL, for example:

```txt
https://ridezon-api-production.up.railway.app
```

## 3. Deploy the frontend on Vercel

1. Go to [Vercel](https://vercel.com/).
2. Import the same GitHub repository.
3. Set the project root directory to `Client`.
4. Add these environment variables:

```env
NEXT_PUBLIC_API_BASE_URL=https://your-backend-url/api
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
```

5. Deploy the project.
6. Copy the Vercel URL, for example:

```txt
https://ridezon-student-rides.vercel.app
```

## 4. Update backend CORS after frontend deploy

Go back to Railway and set:

```env
FRONTEND_URLS=https://your-frontend.vercel.app
```

If you want both production and local access:

```env
FRONTEND_URLS=http://localhost:3000,https://your-frontend.vercel.app
```

Redeploy the backend after changing env vars.

## 5. Google login setup

Because this app uses Google login in the frontend, configure Google OAuth:

1. Open [Google Cloud Console](https://console.cloud.google.com/).
2. Create or select a project.
3. Create OAuth credentials for a Web application.
4. Add these Authorized JavaScript origins:

- `http://localhost:3000`
- `https://your-frontend.vercel.app`

5. Copy the client ID into:

```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
```

## 6. Important notes

- The old `docker-compose*.yml` files in the repo appear to belong to another project and should not be used for this app.
- The frontend now reads the backend URL from `NEXT_PUBLIC_API_BASE_URL`.
- The backend now reads allowed frontend domains from `FRONTEND_URLS`.
- `npx prisma db push` is fine for a student/demo project. For a stricter production workflow later, switch to Prisma migrations.
