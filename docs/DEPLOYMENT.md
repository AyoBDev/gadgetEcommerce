# Deploying to Railway

This app is a Next.js 15 + Payload CMS 3 project backed by Postgres, with media
in S3-compatible object storage.

## What's already configured

- **`railway.json`** — build runs `pnpm build`, start runs
  `pnpm migrate && pnpm start`, health check hits `/api/health`.
  Migrations run at **start**, not build: Railway's builder is not on the
  private network, so the database is only reachable from the deployed
  container. The build itself needs no database (dynamic pages render on
  demand).
- **`.nvmrc` / `engines`** — pins Node ≥ 20.9 for Nixpacks.
- **`packageManager`** — pins pnpm so Railway installs with it.
- **Database migrations** live in `src/migrations/` and run automatically on
  every deploy (`payload migrate` is idempotent — already-applied migrations are
  skipped).
- **Postgres SSL** is enabled when `DATABASE_SSL=true`.

## One-time setup

1. **Create the Railway project** and add a **Postgres** plugin.
2. **Add this repo** as a service (deploy from GitHub).
3. **Set environment variables** on the service (see `.env.example` for the full
   list). At minimum:

   | Variable | Value |
   |---|---|
   | `DATABASE_URL` | `${{ Postgres.DATABASE_URL }}` (Railway private URL) |
   | `DATABASE_SSL` | `false` for the private URL; `true` for a public/managed URL |
   | `PAYLOAD_SECRET` | 32+ random chars (`openssl rand -base64 32`) |
   | `NEXT_PUBLIC_SERVER_URL` | your Railway domain, e.g. `https://your-app.up.railway.app` |
   | `NEXT_PUBLIC_WHATSAPP_NUMBER` | international number, no `+` |
   | `ADMIN_EMAIL` / `ADMIN_PASSWORD` | first admin login (seeded on first boot) |
   | `S3_BUCKET`, `S3_REGION`, `S3_ENDPOINT`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` | object storage for media (AWS S3, Cloudflare R2, …) |

4. **Deploy.** The build compiles the app (no database needed); on start the
   container runs migrations against the Postgres plugin and then serves the
   app. The health check waits for `/api/health` (which verifies DB
   connectivity) to return 200.

## Media storage (required)

Railway's filesystem is **ephemeral** — anything written to disk is lost on the
next deploy or restart. Media uploads therefore **must** go to S3-compatible
storage. Set the five `S3_*` variables to a bucket you control. Without them,
Payload falls back to on-disk storage and uploaded images will disappear on
redeploy.

## Working with migrations

- **Generate a migration after changing collections/fields:**
  `pnpm migrate:create <name>` (writes to `src/migrations/`). Commit the result.
- **Check status:** `pnpm migrate:status`.
- **Apply manually:** `pnpm migrate` (also runs automatically on deploy).

> Note: `pnpm migrate:create` also rewrites `src/payload-types.ts`. This repo
> keeps a hand-maintained `payload-types.ts`; after running `migrate:create`,
> revert the `payload-types.ts` change (`git checkout -- src/payload-types.ts`)
> and keep only the new files under `src/migrations/`.

## Local production check

To reproduce the Railway build locally against a fresh database:

```bash
createdb jaysmart_prodcheck
DATABASE_URL=postgres://…/jaysmart_prodcheck \
PAYLOAD_SECRET=$(openssl rand -base64 32) \
NEXT_PUBLIC_SERVER_URL=http://localhost:3000 \
  pnpm migrate && pnpm build && pnpm start
```
