# Migrations

Use when a Payload project needs schema changes shipped under version control — adding fields/collections, migrating data, or syncing Postgres/SQLite Drizzle schema with the latest config. Also covers running migrations in production and writing per-adapter migration logic.

## Quick Reference

| Task                                    | Solution                             | Section                                            |
| --------------------------------------- | ------------------------------------ | -------------------------------------------------- |
| Create a migration                      | `pnpm payload migrate:create <name>` | [CLI Commands](#cli-commands)                      |
| Run pending migrations                  | `pnpm payload migrate`               | [CLI Commands](#cli-commands)                      |
| Check migration status                  | `pnpm payload migrate:status`        | [CLI Commands](#cli-commands)                      |
| Roll back last batch                    | `pnpm payload migrate:down`          | [CLI Commands](#cli-commands)                      |
| Roll back all, re-run                   | `pnpm payload migrate:refresh`       | [CLI Commands](#cli-commands)                      |
| Drop all, start fresh                   | `pnpm payload migrate:fresh`         | [CLI Commands](#cli-commands)                      |
| Run migrations on server boot           | `prodMigrations` in adapter config   | [Production Workflow](#production-workflow)        |
| Write a Mongo migration with a session  | pass `{ session }` to Mongoose calls | [Writing Migrations — MongoDB](#mongodb)           |
| Write a Postgres migration with Drizzle | `payload.db.drizzle` + `sql` tag     | [Writing Migrations — Postgres](#postgres--sqlite) |
| Override migrations directory           | `migrationDir` in adapter options    | [Configuration](#configuration)                    |

## CLI Commands

Requires a `payload` script in `package.json`:

```json
{
  "scripts": {
    "payload": "cross-env PAYLOAD_CONFIG_PATH=src/payload.config.ts payload"
  }
}
```

All commands: `pnpm payload migrate[:<sub-command>]`

| Command                 | What it does                                              |
| ----------------------- | --------------------------------------------------------- |
| `migrate`               | Run all pending migrations (in creation order)            |
| `migrate:create [name]` | Generate a new migration file from schema diff            |
| `migrate:status`        | Print which migrations have/haven't run                   |
| `migrate:down`          | Roll back the last batch of migrations                    |
| `migrate:refresh`       | Roll back all migrations, then re-run them                |
| `migrate:reset`         | Roll back all migrations (no re-run)                      |
| `migrate:fresh`         | Drop all DB entities + re-run all migrations from scratch |

### Flags for `migrate:create`

- `--skip-empty` — skip the "no schema changes detected" prompt (useful in CI with Postgres).
- `--force-accept-warning` / `--forceAcceptWarning` — accept any prompts automatically; creates a blank migration even when no schema changes are detected.

## Writing Migrations

Each migration lives in a TypeScript file with two named exports:

```ts
// see test/database/up-down-migration/int.spec.ts
import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'

export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  // Run this to apply the migration.
  // Pass req to any Local API calls to keep them inside the transaction.
  await payload.update({
    collection: 'posts',
    where: { status: { equals: 'draft' } },
    data: { publishedAt: null },
    req, // participates in migration transaction
  })
}

export async function down({ payload, req }: MigrateDownArgs): Promise<void> {
  // Revert the migration if up() fails.
}
```

Each migration runs inside a transaction automatically. If `up()` throws, the transaction is aborted — no partial changes are applied. Pass `req` to all Local API calls inside migrations to keep them in that transaction.

### MongoDB

```ts
// see test/database/migrations-cli.int.spec.ts
import type { MigrateUpArgs } from '@payloadcms/db-mongodb'

export async function up({ session, payload, req }: MigrateUpArgs): Promise<void> {
  // Access Mongoose model directly; pass { session } to stay in the transaction.
  const posts = await payload.db.collections['posts'].collection.find({ session }).toArray()

  // Or use the Local API (pass req for transaction membership):
  await payload.update({
    collection: 'posts',
    where: { _id: { exists: true } },
    data: { legacyField: null },
    req,
  })
}
```

MongoDB requires a replica set for transactions. Without one, each operation runs independently.

### Postgres / SQLite

```ts
// see test/database/up-down-migration/migrations/20260328_094148.ts
import { sql } from '@payloadcms/db-postgres'
import type { MigrateUpArgs } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  // db is the Drizzle instance, already bound to the migration transaction.
  const { rows } = await db.execute(sql`
    UPDATE posts SET published_at = NOW() WHERE status = 'published'
  `)
}
```

For SQLite, import types from `@payloadcms/db-sqlite` and call `db.run(sql`...`)` instead of `db.execute`.

## Configuration

### `migrationDir`

Override where Payload stores and reads migration files. Default: `./src/migrations` (Payload also searches `./dist/migrations` and `./migrations`).

```ts
import { postgresAdapter } from '@payloadcms/db-postgres'

export default buildConfig({
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URL },
    migrationDir: './migrations', // custom path
    push: false, // required in production
  }),
})
```

Same option is available on `mongooseAdapter` and `sqliteAdapter`.

### `prodMigrations`

Pass an array of migration modules to run automatically at server startup (production only). Import the `migrations` index Payload generates for you:

```ts
import { migrations } from './migrations'
import { postgresAdapter } from '@payloadcms/db-postgres'

export default buildConfig({
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URL },
    prodMigrations: migrations,
    push: false,
  }),
})
```

Payload runs only the pending subset on startup and skips already-applied migrations.

### SQLite: enabling transactions

SQLite transactions are disabled by default. To use transactions in migrations (and all operations), pass `transactionOptions: {}`:

```ts
import { sqliteAdapter } from '@payloadcms/db-sqlite'

export default buildConfig({
  db: sqliteAdapter({
    client: { url: 'file:./payload.db' },
    transactionOptions: {}, // enable transactions
  }),
})
```

See [ADAPTERS.md#transactions](ADAPTERS.md#transactions) for the full per-adapter transaction API.

## Production Workflow

### Postgres / SQLite: standard CI workflow

1. **Local development** — leave `push: true` (default). Drizzle auto-syncs schema changes as you work.
2. **Create migration** — once a feature is complete, run `pnpm payload migrate:create`. This diffs your current schema against the last migration state and emits a SQL migration file. Review the file before committing.
3. **CI build script** — run migrations before building:

   ```json
   {
     "scripts": {
       "ci": "payload migrate && pnpm build"
     }
   }
   ```

4. **Production** — `payload migrate` runs automatically in CI, applying any pending migrations before the build starts.

Do not mix `push` and migrations on the same local DB. If you've used `push`, reset or recreate your local DB before switching to migration-only mode.

### Server-startup migrations (`prodMigrations`)

Use `prodMigrations` when your build environment cannot reach the production database (e.g., some Vercel edge setups, containers that start before the DB is available at build time). Pass the migrations array to the adapter and Payload runs them at process initialization:

```ts
import { migrations } from './migrations'

db: postgresAdapter({
  pool: { connectionString: process.env.DATABASE_URL },
  prodMigrations: migrations,
})
```

**Warning:** `prodMigrations` at startup adds latency to cold starts. Only use on long-running servers, not serverless platforms where cold-start time matters.

### MongoDB

MongoDB migrations are optional — you only need them when transforming existing data from one shape to another. Schema enforcement is loose, so adding/removing fields rarely requires a migration. When you do need one, run it manually against the production database using your production connection string:

```bash
DATABASE_URL=<prod-url> pnpm payload migrate
```

## Data Migrations

Use the Local API inside `up()` to transform existing data alongside schema changes. Always pass `req` so your data operations participate in the migration transaction.

### Rename a field (copy → backfill → remove)

```ts
import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'

// Postgres example: rename 'body' to 'content' on 'posts'
export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  // 1. Read existing docs (the new 'content' column exists from the schema diff, 'body' is aliased)
  const { docs } = await payload.find({
    collection: 'posts',
    limit: 0, // all docs
    req,
  })

  // 2. Write into the new field name
  for (const doc of docs) {
    await payload.update({
      collection: 'posts',
      id: doc.id,
      data: {
        content: doc.body, // copy old value
      },
      req,
    })
  }
}

export async function down({ payload, req }: MigrateDownArgs): Promise<void> {
  const { docs } = await payload.find({ collection: 'posts', limit: 0, req })
  for (const doc of docs) {
    await payload.update({
      collection: 'posts',
      id: doc.id,
      data: { body: doc.content },
      req,
    })
  }
}
```

### Backfill `_status` when enabling drafts

When you add `versions: { drafts: true }` to an existing collection, all pre-existing documents have no `_status`. Queries that check `_status: { equals: 'published' }` will miss them. Backfill in the same migration:

```ts
import type { MigrateUpArgs } from '@payloadcms/db-postgres'

export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  // Mark all existing posts as published so they appear in public queries.
  const { docs } = await payload.find({
    collection: 'posts',
    where: { _status: { exists: false } },
    limit: 0,
    req,
  })

  for (const doc of docs) {
    await payload.update({
      collection: 'posts',
      id: doc.id,
      data: { _status: 'published' },
      req,
    })
  }
}
```

Until backfilled, include both states in `where` clauses:

```ts
where: {
  or: [
    { _status: { exists: false } },
    { _status: { equals: 'published' } },
  ],
}
```

### Large dataset batching

For collections with many documents, paginate to avoid memory pressure:

```ts
export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  let page = 1
  let hasMore = true

  while (hasMore) {
    const { docs, hasNextPage } = await payload.find({
      collection: 'posts',
      limit: 500,
      page,
      req,
    })

    for (const doc of docs) {
      await payload.update({
        collection: 'posts',
        id: doc.id,
        data: { newField: computeValue(doc) },
        req,
      })
    }

    hasMore = hasNextPage
    page++
  }
}
```

## Gotchas

1. **SQLite transactions disabled by default.** Without `transactionOptions: {}` in the adapter, migrations (and all other operations) run without transaction safety. A migration that fails mid-way can leave the database in a partial state.

2. **MongoDB requires a replica set for transactions.** Single-node MongoDB instances don't support transactions. Use a replica set in production, or accept that MongoDB migration operations run without atomicity.

3. **Don't mix `push` and migrations on the same database.** Drizzle's `push` and `migrate` track schema state separately. Mixing them on one DB causes Payload to warn you and can lead to duplicate or conflicting schema changes.

4. **Environment-specific config in migrations.** If your `payload.config.ts` conditionally enables plugins or features per environment, the generated migration will reflect whichever environment you ran `migrate:create` in. Either: (a) temporarily enable production env vars locally before creating the migration, (b) manually patch the migration file after generation, or (c) maintain separate migration files per environment.

5. **Adding drafts to an existing collection requires a backfill.** Enabling `versions.drafts: true` adds a `_status` field to documents, but existing rows have no `_status` value. Until you backfill, use a `where` clause that handles both states:

   ```ts
   where: {
     or: [
       { _status: { exists: false } },
       { _status: { equals: 'published' } },
     ],
   }
   ```

   Write a migration to set `_status = 'published'` on all existing documents to normalize the data. See [COLLECTIONS.md#versioning--drafts](COLLECTIONS.md#versioning--drafts) for the full drafts config.

6. **Migration files must stay in source control.** Payload uses the presence of prior migration files to compute schema diffs. Deleting them causes incorrect diffs on the next `migrate:create`.

## Related

- [ADAPTERS.md#transactions](ADAPTERS.md#transactions) — per-adapter transaction APIs (`beginTransaction`, `commitTransaction`, `rollbackTransaction`)
- [PRODUCTION.md#deploying-migrations](PRODUCTION.md#deploying-migrations) — running migrations in CI/CD pipelines
- [COLLECTIONS.md#versioning--drafts](COLLECTIONS.md#versioning--drafts) — enabling drafts + the `_status` field migration pattern
