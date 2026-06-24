# Deploying DRIP Syndicate to Render

This walks through a production deployment using **Render** for hosting and
**Supabase** for the database and media storage. Total time ~20 minutes.

## 0. Prerequisites

- A GitHub repo containing this monorepo.
- A [Supabase](https://supabase.com) project (free tier is fine to start).
- A [Render](https://render.com) account connected to your GitHub.

## 1. Supabase — database + storage

1. Create a Supabase project. Note the project ref (e.g. `abcdxyz`).
2. **Database connection string:** Project → *Settings → Database → Connection
   string → URI*. Convert it to the Npgsql format the API expects:
   ```
   Host=db.<ref>.supabase.co;Port=5432;Database=postgres;Username=postgres;Password=<your-password>;SSL Mode=Require;Trust Server Certificate=true
   ```
3. **Storage bucket:** Storage → *New bucket* → name it `media` → make it
   **public** (or keep private and serve signed URLs). The backend uploads here.
4. **Service role key:** Project → *Settings → API → service_role* key. This is
   secret — it is used server-side only for uploads.

> You can alternatively use a **Render PostgreSQL** instance instead of Supabase
> Postgres: *New → PostgreSQL*, then copy its *Internal Connection String*. If
> you do, you still need Supabase (or S3) for media storage.

## 2. Backend — Render Web Service (Docker)

1. **New → Web Service** → pick your repo.
2. Settings:
   - **Root Directory:** `backend`
   - **Runtime:** `Docker` (Render auto-detects `backend/Dockerfile`)
   - **Health Check Path:** `/health`
   - **Instance type:** Starter or higher.
3. **Environment variables** (Environment tab):

   | Key | Value |
   |-----|-------|
   | `ASPNETCORE_ENVIRONMENT` | `Production` |
   | `ASPNETCORE_URLS` | `http://0.0.0.0:8080` |
   | `ConnectionStrings__Default` | *(the Npgsql string from step 1.2)* |
   | `Jwt__Issuer` | `drip-syndicate` |
   | `Jwt__Audience` | `drip-syndicate-client` |
   | `Jwt__Secret` | *(a long random string ≥ 32 chars)* |
   | `Jwt__AccessTokenMinutes` | `15` |
   | `Jwt__RefreshTokenDays` | `30` |
   | `Supabase__Url` | `https://<ref>.supabase.co` |
   | `Supabase__ServiceKey` | *(service_role key)* |
   | `Supabase__Bucket` | `media` |
   | `Cors__Origins__0` | `https://<your-frontend-domain>` |
   | `Seed__Enabled` | `true` (set to `false` after first boot) |

4. **Create Web Service.** On first boot the API runs EF migrations and seeds
   data. Note the URL, e.g. `https://drip-backend.onrender.com`.
5. Confirm `https://drip-backend.onrender.com/health` returns healthy and
   `…/swagger` loads.

## 3. Frontend — Render Web Service (Docker)

1. **New → Web Service** → same repo.
2. Settings:
   - **Root Directory:** `frontend`
   - **Runtime:** `Docker`
   - **Docker Build Args:** add
     `NEXT_PUBLIC_API_URL = https://drip-backend.onrender.com/api/v1`
     (this is inlined into the client bundle at build time — it must be set as a
     build arg, not just a runtime env var).
3. **Environment variables:**

   | Key | Value |
   |-----|-------|
   | `NEXT_PUBLIC_API_URL` | `https://drip-backend.onrender.com/api/v1` |

4. **Create Web Service.** Note the URL, e.g.
   `https://drip-frontend.onrender.com`.

## 4. Wire CORS back to the frontend

Return to the **backend** service and set `Cors__Origins__0` to the real
frontend URL from step 3 (e.g. `https://drip-frontend.onrender.com`). Save —
Render redeploys automatically.

## 5. Custom domains

For each service: *Settings → Custom Domains → Add*. Suggested:

- `shop.dripsyndicate.com` → frontend
- `api.dripsyndicate.com` → backend

Add the shown CNAME records at your DNS provider. Render provisions TLS
automatically. Afterwards update:
- frontend build arg `NEXT_PUBLIC_API_URL` → `https://api.dripsyndicate.com/api/v1`
- backend `Cors__Origins__0` → `https://shop.dripsyndicate.com`

## 6. Connecting the database (recap)

The backend talks to Postgres purely through `ConnectionStrings__Default`. No
extra wiring is needed — once that variable is correct and the service boots,
migrations run and the schema appears in Supabase. Verify in Supabase → *Table
Editor*.

## 7. Deploying updates

- **Automatic:** Render redeploys on every push to `main` (enable *Auto-Deploy*).
- **Via CI:** the included GitHub Actions workflow can trigger a deploy by
  hitting a Render **Deploy Hook**. Create one per service
  (*Settings → Deploy Hook*) and store the URLs as repo secrets
  `RENDER_BACKEND_HOOK` and `RENDER_FRONTEND_HOOK`.
- **Manual:** *Manual Deploy → Deploy latest commit* in the Render dashboard.

## 8. Post-launch hardening

- Set `Seed__Enabled=false` once the database is populated.
- Change the seeded admin password.
- Rotate `Jwt__Secret` and the Supabase service key if they were ever shared.
- Consider moving the bucket to private + signed URLs if media is sensitive.
