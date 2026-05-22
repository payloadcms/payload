# Production

Use when preparing a Payload project for deployment — environment variables, security hardening, CORS/CSRF config, upload restrictions, GraphQL limits, database setup, and serverless/Docker considerations. Also covers common troubleshooting patterns.

## Quick Reference

| Task                                           | Solution                                                | Section                                                        |
| ---------------------------------------------- | ------------------------------------------------------- | -------------------------------------------------------------- |
| Build without a DB connection                  | `next build --experimental-build-mode compile`          | [Build Without DB Connection](#build-without-db-connection)    |
| Restrict allowed CORS origins                  | `cors: [...]` in root config                            | [CORS](#cors)                                                  |
| Add CSRF trusted origins                       | `csrf: [...]` in root config                            | [Cookies + CSRF](#cookies--csrf)                               |
| Set GraphQL complexity cap                     | `graphQL.maxComplexity` in root config                  | [GraphQL Complexity Limits](#graphql-complexity-limits)        |
| Lock account after failed logins               | `auth.maxLoginAttempts` + `auth.lockTime` on collection | [maxLoginAttempts / lockTime](#maxloginattempts--locktime)     |
| Restrict upload file types                     | `upload.mimeTypes` on the upload collection             | [Upload Abuse Prevention](#upload-abuse-prevention)            |
| Disable local file storage for uploads         | `upload.disableLocalStorage: true` on collection        | [Persistent vs Ephemeral FS](#persistent-vs-ephemeral-fs)      |
| Run migrations automatically on server startup | `prodMigrations` in adapter config                      | [Deploying Migrations](#deploying-migrations)                  |
| DocumentDB / CosmosDB compatibility            | `connectOptions` / `compatibilityOptions.cosmosdb`      | [DocumentDB / CosmosDB Caveats](#documentdb--cosmosdb-caveats) |

## Build Without DB Connection

The Next.js build process runs SSG by default, which calls the Payload Local API and therefore requires a live database connection. Two solutions:

### Option 1: `--experimental-build-mode compile`

Split the build into two passes — compile (no DB needed) and generate (DB needed):

```bash
# Pass 1: compile only — no SSG, no DB connection required
pnpm next build --experimental-build-mode compile

# Pass 2: static generation — run when DB is available
pnpm next build --experimental-build-mode generate
```

If `NEXT_PUBLIC_*` env vars need to be inlined and you still have no DB, use `generate-env` instead of `generate`:

```bash
pnpm next build --experimental-build-mode generate-env
```

### Option 2: Opt Out of SSG per Route

Add the following export to every route segment file that uses the Payload Local API:

```ts
export const dynamic = 'force-dynamic'
```

This disables static optimization for those routes and avoids the DB connection at build time. **All opted-out routes will render dynamically — no static caching benefit.**

## Deployment Checklist

Before going to production, verify:

- `secret` / `PAYLOAD_SECRET` — long, random, never committed to source control
- `DATABASE_URL` — set in the deployment platform, never hardcoded
- `NODE_ENV=production` — enables production-mode behaviour in Next.js + Payload
- `serverURL` — set to the full public URL of the API (e.g. `https://api.myapp.com`); required for CSRF and cookie behaviour
- `auth.cookies.secure: true` on auth collections (requires HTTPS)
- CORS allow-list narrowed from `*` to specific origins
- CSRF allow-list populated if frontend is on a different origin
- `push: false` on relational adapters (Postgres, SQLite) — prevents Drizzle auto-push in production
- Access control reviewed — default behavior requires authentication; verify public routes are intentional

Rotating `PAYLOAD_SECRET` **invalidates all existing JWTs and API keys**. Plan a re-issue process before rotating in production. See [AUTHENTICATION.md](AUTHENTICATION.md) for details.

## Cookies + CSRF

Payload sets an HTTP-only cookie on login. See [AUTHENTICATION.md#cookies--csrf](AUTHENTICATION.md#cookies--csrf) for the full cookie config.

### CSRF Allow-list

Add trusted frontend origins to the root `csrf` array. See [AUTHENTICATION.md#csrf-allow-list](AUTHENTICATION.md#csrf-allow-list) for the full example and gotchas.

**Gotcha:** `csrf: ['*']` disables CSRF protection — use an explicit allowlist in production. Omitting `csrf` when the frontend is on a different origin causes cookie-authenticated requests to fail with 403.

## CORS

Restrict which origins can access the Payload REST and GraphQL APIs:

```ts
// see docs/configuration/overview.mdx
import { buildConfig } from 'payload'

export default buildConfig({
  serverURL: 'https://api.myapp.com',
  cors: ['https://app.myapp.com', 'https://staging.myapp.com'],
})
```

`cors` controls the `Access-Control-Allow-Origin` header. Setting it to `'*'` is convenient in development but exposes the API to any origin in production.

CORS and CSRF serve different purposes:

- **CORS** — browser preflight gate; controls which origins can read the response
- **CSRF** — Payload middleware; validates that a cookie-authenticated request comes from a trusted origin

Both must be configured for a cross-domain setup to work end-to-end.

## GraphQL Complexity Limits

GraphQL lets API consumers write arbitrary nested queries, which can be expensive. Set a complexity cap to reject abusive queries before they reach the database:

```ts
// see docs/production/preventing-abuse.mdx
import { buildConfig } from 'payload'

export default buildConfig({
  graphQL: {
    maxComplexity: 1000, // default field weight: 1; relationship/upload fields: 10
  },
})
```

Default per-field complexity: **1**. Relationship and upload fields: **10**. Tune `maxComplexity` to a value that allows legitimate admin panel usage while blocking deep recursive queries.

If GraphQL is not needed at all, disable it:

```ts
graphQL: {
  disable: true,
}
```

**Gotcha:** `maxComplexity` only protects the GraphQL endpoint. REST queries (`/api/<collection>?depth=10`) are not affected — use `maxDepth` in the root config to cap REST depth:

```ts
maxDepth: 5, // default 10
```

See [QUERIES.md](QUERIES.md) for depth and performance query options.

## maxLoginAttempts / lockTime

Lock user accounts after repeated failed logins to prevent brute-force attacks:

```ts
// see test/auth/config.ts
import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    maxLoginAttempts: 5, // lock after 5 failures; set to 0 to disable
    lockTime: 600 * 1000, // ms; default 600000 (10 minutes)
  },
}
```

`lockTime` is in **milliseconds**. After the lock expires, the counter resets and the user can try again. To manually unlock an account, call `POST /api/users/unlock` (requires `unlock` access control) or use the admin panel.

See [AUTHENTICATION.md#auth-config-options](AUTHENTICATION.md#auth-config-options) for the full auth config reference.

## Upload Abuse Prevention

### Restrict MIME Types

Limit uploads to specific file types using `upload.mimeTypes`:

```ts
// see docs/production/preventing-abuse.mdx
import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  upload: {
    mimeTypes: ['image/*'], // images only
    // mimeTypes: ['image/jpeg', 'image/png', 'image/webp'], // specific types
  },
  fields: [],
}
```

Payload rejects uploads that do not match any listed type. Use `image/*` to accept all image subtypes, or list explicit MIME types for tighter control.

### File Size Limits

```ts
upload: {
  limits: {
    fileSize: 5_000_000, // bytes; 5 MB
  },
}
```

### Disable Local Storage

When using a cloud storage plugin (S3, Azure, GCS, etc.), prevent Payload from also writing files to the local filesystem:

```ts
import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  upload: {
    disableLocalStorage: true,
  },
  fields: [],
}
```

Without this, Payload writes a local copy even when a storage plugin is active, wasting disk space and causing stale-file bugs on ephemeral hosts.

### Access Control on Uploads

Review `create` and `update` access on upload collections. If unauthenticated users can upload, ensure you have server-side validation, file scanning, and strict MIME type restrictions in place.

## Persistent vs Ephemeral FS

Some hosting platforms (Heroku, DigitalOcean Apps, Vercel functions) use **ephemeral filesystems** — files written during one request are lost on the next container restart or cold start.

**Ephemeral hosts (uploads will be lost on restart):**

- Heroku
- DigitalOcean Apps
- Vercel (functions and edge)

**Persistent hosts:**

- DigitalOcean Droplets
- Amazon EC2
- Self-hosted servers

If you use Payload's upload feature on an ephemeral host, configure a cloud storage adapter so files are written to permanent storage:

- `@payloadcms/storage-s3` — AWS S3 / S3-compatible (R2, MinIO)
- `@payloadcms/storage-azure` — Azure Blob Storage
- `@payloadcms/storage-gcs` — Google Cloud Storage
- `@payloadcms/storage-vercel-blob` — Vercel Blob Storage
- `@payloadcms/storage-uploadthing` — UploadThing

Set `upload.disableLocalStorage: true` on the collection when using any cloud storage adapter to prevent the redundant local write.

**Gotcha:** Local FS persists in development but not on Vercel/serverless deployments. Always test upload behaviour in a staging environment that mirrors production storage configuration.

## Docker Example

Multi-stage Dockerfile for production Payload deployments. Requires `output: 'standalone'` in `next.config.js`:

```js
// next.config.js
const nextConfig = {
  output: 'standalone',
}
```

```dockerfile
# From https://github.com/vercel/next.js/blob/canary/examples/with-docker/Dockerfile
FROM node:24-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN \
  if [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  else echo "Lockfile not found." && exit 1; \
  fi

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN \
  if [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm run build; \
  else npm run build; \
  fi

FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
RUN mkdir .next && chown nextjs:nodejs .next
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
ENV PORT 3000
CMD HOSTNAME="0.0.0.0" node server.js
```

Set required env vars at deploy time: `PAYLOAD_SECRET`, `DATABASE_URL`, `PAYLOAD_CONFIG_PATH` (if needed). If the build stage cannot reach the database, see [Build Without DB Connection](#build-without-db-connection).

## Deploying Migrations

### Postgres / SQLite: CI workflow

Run `pnpm payload migrate` before the build step in CI so migrations are applied before the new code goes live:

```json
{
  "scripts": {
    "ci": "payload migrate && pnpm build"
  }
}
```

### Server-startup migrations (`prodMigrations`)

When the build environment cannot reach the production database (e.g., Docker build stage, Vercel build), configure migrations to run automatically at server startup instead:

```ts
// see MIGRATIONS.md#prodMigrations
import { migrations } from './migrations' // generated by migrate:create
import { postgresAdapter } from '@payloadcms/db-postgres'

export default buildConfig({
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URL },
    prodMigrations: migrations,
    push: false,
  }),
})
```

`prodMigrations` adds latency to cold starts — use only on long-running servers, not serverless platforms. See [MIGRATIONS.md#production-workflow](MIGRATIONS.md#production-workflow) for the full workflow.

## DocumentDB / CosmosDB Caveats

### AWS DocumentDB

DocumentDB requires authentication options in `connectOptions`:

```ts
import { mongooseAdapter } from '@payloadcms/db-mongodb'

export default buildConfig({
  db: mongooseAdapter({
    url: process.env.DATABASE_URL,
    connectOptions: {
      // DocumentDB-specific TLS/auth settings go here
    },
  }),
})
```

### Azure CosmosDB

CosmosDB's MongoDB API is not fully compatible — it has strict indexing limits and does not support multi-document transactions. Use the `compatibilityOptions.cosmosdb` preset:

```ts
// see docs/production/deployment.mdx
import { mongooseAdapter, compatibilityOptions } from '@payloadcms/db-mongodb'

export default buildConfig({
  db: mongooseAdapter({
    url: process.env.DATABASE_URL,
    ...compatibilityOptions.cosmosdb,
    indexSortableFields: true, // required for admin panel sorting
  }),
})
```

`compatibilityOptions.cosmosdb` applies:

| Option                            | Value   | Reason                                                |
| --------------------------------- | ------- | ----------------------------------------------------- |
| `bulkOperationsSingleTransaction` | `true`  | Avoids Cosmos DB transaction limits on bulk ops       |
| `transactionOptions`              | `false` | Disables multi-document transactions (unsupported)    |
| `useJoinAggregations`             | `false` | Uses separate find queries instead of correlated subs |
| `usePipelineInSortLookup`         | `false` | Disables `$lookup` pipeline during sort               |

## Troubleshooting Pointers

Brief pointers — a full troubleshooting guide is at `docs/troubleshooting/troubleshooting.mdx`.

### Dependency Duplicates

If you see `TypeError: Cannot destructure property 'config' of...` or React context errors, you likely have duplicate versions of `payload`, `@payloadcms/*`, or `react`/`react-dom`. Diagnose with:

```bash
pnpm why @payloadcms/ui
pnpm dedupe
```

Pin all `payload` and `@payloadcms/*` packages to exact versions (remove `^`/`~` prefixes) and reinstall.

### `--experimental-https` and HMR

When running with `--experimental-https`, the WebSocket for Hot Module Reloading switches to `wss://`. Set `USE_HTTPS=true` in `.env` so HMR uses the correct protocol:

```
USE_HTTPS=true
```

### Database Password Special Characters

If Payload cannot connect to Postgres and you see `Cannot read properties of undefined (reading 'searchParams')`, check whether your `DATABASE_URL` password contains special characters. Encode them:

```ts
const encodedPassword = encodeURIComponent(process.env.DB_PASSWORD)
const url = `postgres://user:${encodedPassword}@host/db`
```

### Monorepo Version Skew

In a monorepo, all packages must use the **same version** of `payload`, `@payloadcms/*`, `next`, `react`, and `react-dom`. Version skew produces context errors like `useUploadHandlers must be used within UploadHandlersProvider`. Install Payload dependencies at the monorepo root to prevent hoisting conflicts.

### "Unauthorized" on Login (CORS / CSRF Mismatch)

If login appears to succeed but all subsequent requests return 401/403, the auth cookie is being set but rejected. Check:

1. `serverURL` matches the deployed API origin exactly
2. `csrf` includes the frontend origin
3. `auth.cookies.secure` matches whether the site is served over HTTPS
4. `auth.cookies.sameSite` is `'None'` when frontend and API are on different domains

## Gotchas

1. **Local FS persists in dev but not in production.** Uploads written to the local filesystem during development disappear on Vercel / Heroku / container restarts. Always use a cloud storage adapter for production uploads and test on a staging environment that mirrors production.

2. **`csrf: ['*']` disables CSRF protection.** A wildcard allows any origin to send cookie-authenticated requests — it defeats the purpose of CSRF validation. Use explicit origins.

3. **CSRF omission causes cross-domain login failure.** If the frontend is on a different origin and `csrf` doesn't list it, every cookie-authenticated request will fail with 403 after a successful login. This looks like a session bug but is a config issue.

4. **`maxComplexity` only protects GraphQL.** REST queries are not complexity-scored. Use `maxDepth` to limit REST population depth.

5. **`experimental-build-mode compile` leaves `NEXT_PUBLIC_*` vars undefined.** If your frontend reads `NEXT_PUBLIC_*` env vars, run `generate` or `generate-env` afterward — or opt out of SSG with `export const dynamic = 'force-dynamic'` on affected routes.

6. **`prodMigrations` adds cold-start latency.** It is suited for long-running servers, not serverless functions where every cold start matters. For serverless, run `payload migrate` in your CI/CD pipeline before deploying.

7. **`PAYLOAD_SECRET` rotation invalidates all tokens and API keys.** Plan a re-issue process before rotating in production. See [AUTHENTICATION.md](AUTHENTICATION.md).

## Related

- [AUTHENTICATION.md](AUTHENTICATION.md) — CSRF allow-list, cross-domain cookies, `PAYLOAD_SECRET` rotation, `maxLoginAttempts`
- [ADAPTERS.md](ADAPTERS.md) — per-adapter transaction APIs, `push` vs migrations, SQLite transactions
- [QUERIES.md](QUERIES.md) — `maxDepth`, `defaultDepth`, `select`, query performance
- [MIGRATIONS.md](MIGRATIONS.md) — `prodMigrations`, CI migration workflow, `migrate:create`
