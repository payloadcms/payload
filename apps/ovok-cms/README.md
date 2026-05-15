# @actimi/ovok-cms

Deployable Payload instance that backs Ovok's `/v1/content/*` API.

- **Multi-tenant** — every collection is scoped by the
  `x-ovok-tenant-id` header injected by the Ovok proxy.
- **No admin UI** — `admin.disable: true`. The Ovok Dashboard
  (`../ovok-dashboard`) renders forms client-side using the schema
  exposed at `/_ovok/schema`.
- **No Payload-native auth** — auth is delegated to Ovok via a custom
  strategy that checks the `x-ovok-internal-key` header.

## Layout

```
src/
  payload.config.ts          # Postgres + multi-tenant plugin + schema endpoint
  access/ovokInternal.ts     # auth strategy validating the shared key
  collections/
    Users.ts                 # required by Payload, never populated
    Tenants.ts               # one row per Medplum project (Ovok-managed)
    Media.ts                 # uploads, tenant-scoped
    Posts.ts                 # example content collection
  endpoints/schema.ts        # GET /_ovok/schema for dashboard form rendering
  app/                       # Next.js routes that serve Payload's API
```

## Required env

| Var                         | Notes                                                       |
| --------------------------- | ----------------------------------------------------------- |
| `DATABASE_URI`              | Dedicated Postgres                                          |
| `PAYLOAD_SECRET`            | 32+ random chars — `openssl rand -base64 32`                |
| `PAYLOAD_PUBLIC_SERVER_URL` | Internal URL the Ovok proxy hits                            |
| `PAYLOAD_INTERNAL_API_KEY`  | Shared secret, identical to Ovok's `PAYLOAD_INTERNAL_API_KEY` |

See `.env.example`.

## Run locally

```bash
pnpm install
cp .env.example .env       # fill in PAYLOAD_SECRET, PAYLOAD_INTERNAL_API_KEY
pnpm dev                   # http://localhost:3000
```

Pair with `ovok-internal` via its `docker-compose --profile payload up` —
that wires `DATABASE_URI` to a sibling Postgres container and shares the
internal key with the Ovok backend.

## Build & deploy

```bash
pnpm build
pnpm start                 # production server
```

Or use the Dockerfile (inherited from Payload's `with-postgres`
template; no Ovok-specific edits). Mount Postgres separately and pass
the env vars above.

## Syncing upstream Payload

This `apps/ovok-cms/` directory is the **only** Ovok-specific addition
to the fork. Upstream `payloadcms/payload` is otherwise untouched, so:

```bash
git remote add upstream https://github.com/payloadcms/payload.git
git fetch upstream
git merge upstream/main          # no conflicts in apps/ovok-cms expected
```

If a merge ever does conflict here, treat this directory as
authoritative — keep the Ovok-specific code.

## Contract with the Ovok backend

The Ovok proxy at `src/payload-cms/` in `ovok-internal` is the only
external entry point. Payload's port is never exposed.

1. Every request carries `x-ovok-internal-key` (validated by
   `access/ovokInternal.ts`) and `x-ovok-tenant-id` (consumed by the
   multi-tenant plugin).
2. Tenants are provisioned via the REST API:
   `POST /api/tenants` with `{ medplumProjectId, slug, active: true }`.
   `PATCH /api/tenants/:id` to flip `active` on/off.
3. Custom dashboard endpoint: `GET /_ovok/schema` returns the
   collection schema; the Ovok Dashboard reads it once on load.
