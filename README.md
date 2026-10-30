# DCITC Website

Monorepo: `frontend/` (Next.js 16, Vercel) + `backend/` (Express 5 API, Render/Railway). OpenSpec planning lives at root.

## Frontend (Vercel)

```bash
cd frontend
cp .env.example .env.local
# fill API_ORIGIN, NEXT_PUBLIC_SITE_URL, IMAGE_REMOTE_HOSTS
npm ci
npm run dev
```

## Build

```bash
cd frontend
npm run lint
npm run build
```

## Environment

- `API_ORIGIN` — absolute API origin (server-side + rewrites)
- `NEXT_PUBLIC_SITE_URL` — public site URL
- `IMAGE_REMOTE_HOSTS` — comma-separated image hostnames

## Deploy

Set Vercel project Root Directory to `frontend/`. Set env vars per environment. Promote preview to production after QA. Rollback via Vercel redeploy of previous build.