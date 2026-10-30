# Frontend Deploy / Rollback

## Deploy
1. Set Vercel envs: API_ORIGIN, NEXT_PUBLIC_SITE_URL, IMAGE_REMOTE_HOSTS
2. Set API FRONTEND_URL to Vercel domain
3. Merge frontend change, npm ci && npm run build, deploy preview, walk QA checklist
4. Promote to production, verify OAuth from public domain
5. Remove Netlify site and frontend Supabase env vars

## Rollback
Redeploy previous Vercel build. Note old build cannot authenticate without API; rollback meaningful only with API restore.