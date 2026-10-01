# Deploying Zentic

Three pieces, each on its own host:

| Piece | Host | Folder |
|---|---|---|
| Web app (home page, free audit, dashboard) | Vercel | `web/` |
| API server (audits, cron jobs, Socket.IO) | Render (always-on, Docker) | `server/` |
| Database + login | Supabase (cloud project) | `supabase/migrations/` |

## 1. Supabase
1. Create a project (region close to your users, e.g. Mumbai `ap-south-1`).
2. Apply every file in `supabase/migrations/` in order (`npx supabase link --project-ref <ref>` then `npx supabase db push`).
3. Auth › URL configuration: Site URL = your Vercel URL; add `<vercel-url>/auth/callback` and `<vercel-url>/auth/confirm` to redirect URLs.
4. Note the project URL, anon key and service-role key.

## 2. Render (API server)
Create a Blueprint from this repo (`render.yaml`). Fill the `sync: false` values:
`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ALLOWED_ORIGINS` (your Vercel URL),
`GOOGLE_GENERATIVE_AI_API_KEY`, `OPENAI_API_KEY`, `SCRAPEDO_API_KEY`.
Starter plan or above: free instances sleep, which stops cron jobs and background audits.

## 3. Vercel (web app)
Import the repo, **Root Directory `web`**, framework Next.js. Environment variables:

| Name | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service-role key |
| `NEXT_PUBLIC_API_URL` | Render service URL, e.g. `https://zentic-api.onrender.com` |
| `NEXT_PUBLIC_APP_URL` | the Vercel URL (or custom domain) |
| `NEXT_PUBLIC_IS_CLOUD` | `false` until Stripe plans are configured |
| `ZENTIC_ENCRYPTION_KEY` | 64 hex characters (`openssl rand -hex 32`) |
| `STRIPE_SECRET_KEY` | Stripe key, or a test key until billing is live |
| `CRON_SECRET` | random string; Vercel sends it to `/api/cron/daily-tracking` |

## Not used in production
`LOCAL_RENDERER` and `PUBLIC_AUDIT_DEV_SKIP_VERIFY` are local-development settings; leave them unset.
