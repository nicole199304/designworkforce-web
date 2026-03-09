# Deployment

## Architecture

- Frontend: Vercel
- Backend: Render
- Database: Supabase

## Frontend

- Repo: `nicole199304/designworkforce-web`
- Root Directory: repo root
- Framework: `Vite`
- Build Command: `npm run build`
- Output Directory: `dist`

### Environment Variables

- `VITE_API_BASE_URL=https://YOUR_RENDER_DOMAIN`

## Backend

- Repo: `nicole199304/designworkforce-web`
- Root Directory: repo root
- Build Command: `npm install`
- Start Command: `npm start`

### Environment Variables

- `PORT=3001`
- `SUPABASE_URL=https://wznmruewpdaevhlmpxrf.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SECRET`

## Verification

1. Open `https://YOUR_RENDER_DOMAIN/api/health`
2. Confirm `{"ok":true}`
3. Open the Vercel URL
4. Save one project record
5. Delete one project record
6. Refresh and confirm the data persisted
