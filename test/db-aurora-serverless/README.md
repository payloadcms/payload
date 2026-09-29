# Aurora Serverless / RDS Data API integration suite (opt-in)

Runs `@payloadcms/db-aurora-serverless` against [floci](https://github.com/floci-io/floci)'s RDS Data
API, backed by a real Postgres container. It covers:

- a create → find → update → delete round trip;
- the persistence of array and relationship fields (hasMany join table, a single FK relationship
  and a `join` field);
- transactions — a committed transaction persists every write, while a transaction that fails
  part-way is rolled back with no partial writes left behind;
- schema lifecycle — dropping and recreating the schema, and running a migration **up** and then
  **down**.

The suite is opt-in and skips itself when floci is unavailable, so ordinary test runs and CI are
unaffected.

## Prerequisites

- Docker running. floci starts the backing Postgres container through the Docker socket.
- A floci build that includes numeric placeholder support (`:1`, `:2`, as emitted by Drizzle's
  `aws-data-api` driver). See the companion floci ticket.

## Start floci

```bash
cd /home/emmanuel/ghq/github.com/floci-io/floci
docker compose up -d --build
# wait for health (first build takes several minutes):
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:4566/_floci/health   # expect 200
```

The default endpoint is `http://localhost:4566`. If another service occupies that port, run floci on
a different host port (for example `4567`) and point the suite at it:

```bash
AURORA_ENDPOINT=http://localhost:4567 pnpm run test:int:aurora-serverless
```

## Run the suite

```bash
cd /home/emmanuel/ghq/github.com/payloadcms/payload
pnpm install
AURORA_ENDPOINT=http://localhost:4567 RUN_AURORA_SERVERLESS_TESTS=true PAYLOAD_DATABASE=sqlite \
  pnpm run test:int db-aurora-serverless
```

or, using the dedicated script:

```bash
AURORA_ENDPOINT=http://localhost:4567 RUN_AURORA_SERVERLESS_TESTS=true \
  pnpm run test:int:aurora-serverless
```

`PAYLOAD_DATABASE=sqlite` only selects the harness's database adapter; the suite's config overrides
it with the Aurora Serverless adapter, so no Mongo/Postgres service is needed.

The suite auto-skips when `{AURORA_ENDPOINT}/_floci/health` does not return 200. Set
`RUN_AURORA_SERVERLESS_TESTS=false` to force a skip even when floci is up.

## Environment variables

| Variable                      | Default                 | Purpose                                                           |
| ----------------------------- | ----------------------- | ----------------------------------------------------------------- |
| `AURORA_ENDPOINT`             | `http://localhost:4566` | floci endpoint.                                                   |
| `AURORA_REGION`               | `us-east-1`             | AWS region used by the SDK clients and the adapter.               |
| `AURORA_RESOURCE_ARN`         | _provisions one_        | Reuse an existing RDS cluster ARN; skips cluster provisioning.    |
| `AURORA_SECRET_ARN`           | _provisions one_        | Reuse an existing Secrets Manager ARN; skips secret provisioning. |
| `RUN_AURORA_SERVERLESS_TESTS` | unset                   | `false` force-skips the suite.                                    |

Provisioning (`auroraSetup.ts`) is idempotent: it creates an `aurora-postgresql` cluster
(`payload-test`, database `payload`, master `postgres`/`postgres`), reads its ARN, then creates a
Secrets Manager secret (`payload-test/data-api`) whose JSON `{ username, password }` matches the
master credentials. Supplying both `AURORA_RESOURCE_ARN` and `AURORA_SECRET_ARN` bypasses
provisioning entirely.

## Schema lifecycle

### Drop and recreate

The adapter's `dropDatabase` issues `drop schema ... cascade;` and `create schema ...;` as **two
separate `ExecuteStatement` calls** because the Data API accepts only one statement per call (the
shared Postgres implementation combines them and would fail). The lifecycle test spies on the
adapter's `execute`, asserts both statements were sent individually, checks the tables are gone, then
recreates Payload's tables by re-running the development schema push (`pushDevSchema` from
`@payloadcms/drizzle`, forced past its no-op cache with `PAYLOAD_FORCE_DRIZZLE_PUSH=true`) and proves
the database is usable again with a fresh create/find.

### Migrations

The suite ships a minimal additive migration at `migrations/20260929_lifecycle.ts` (creates and drops
a `lifecycle_marker` table, one statement per call) and points `migrationDir` at it. The test runs
`payload.db.migrate()` and `payload.db.migrateDown()` in-process, proving both directions execute over
the Data API. The migration is additive because the schema itself is still created by the dev push;
running migrations **instead of** the dev push is not viable as-is for the numeric reason below.

## Schema creation path

The suite uses the **development schema push** (`NODE_ENV=test` → `pushDevSchema`). Over the Data
API, drizzle-kit's introspection and generated DDL run as single unparameterized statements, which
floci supports, so the push creates Payload's schema directly.

A `beforeSchemaInit` hook in `config.ts` maps the `payload_migrations.batch` column to `integer`.
Payload models number fields as `numeric(..., { mode: 'number' })`; Drizzle serializes that as a
string parameter **without** a `DECIMAL` type hint, which floci rejects for numeric columns. That
breaks the dev-push migration marker (`batch = -1`) and the `batch` written when a migration runs.
Mapping the bookkeeping column to `integer` makes both work, which is what lets the lifecycle
migration run.

A full migration workflow (`push: false`, the generated schema migration run by `payload migrate`)
is **not** viable as-is for the same reason, because those generated migrations contain multi-statement
`db.execute` calls that the Data API rejects. If that is needed later, the numeric parameter binding
below must be resolved first.

## Known limitation: numeric parameters

Any `numeric(..., { mode: 'number' })` column is sent to the Data API as a string parameter without
a type hint. floci binds that with `setString`, so Postgres rejects e.g. `INSERT INTO ... (batch)
VALUES ($1)` with `column "batch" is of type numeric but expression is of type character varying`.
This affects user-defined number fields as well as Payload's migration bookkeeping. The suite avoids
number fields and keeps the migrations column as `integer`; see the floci ticket / adapter report
for the underlying fix.
