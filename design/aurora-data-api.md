# Design: Aurora Serverless / RDS Data API adapter

- Status: Proposal
- Discussion: https://github.com/payloadcms/payload/discussions/10566
- Related driver: [`drizzle-orm/aws-data-api/pg`](https://orm.drizzle.team/docs/connect-aws-data-api)

## Summary

Add an official Postgres-flavoured adapter that talks to Amazon Aurora Serverless
(v1 & v2) and Amazon RDS through the **RDS Data API** instead of a TCP
connection pool. This lets a Payload deployment run with **zero open database
connections**, which is what Aurora Serverless v2 requires in order to
scale to zero / auto-pause and actually save money.

Proposed package: **`@payloadcms/db-aurora-serverless`** (name up for bikeshed;
`@payloadcms/db-aws-data-api` is the alternative). It reuses virtually all of
`@payloadcms/drizzle/postgres` for schema/query/CRUD logic and only swaps the
Drizzle driver + connection lifecycle.

## Motivation

Payload's `postgresAdapter` only accepts a `pool` (`pg.PoolConfig`) and always
builds a `node-postgres` pool. Aurora Serverless v2 auto-pause requires **no
established connections**; any long-lived pool (including a pool that holds one
idle client) keeps the instance awake and defeats the cost saving that is the
whole reason to use Serverless v2.

Drizzle already ships a first-class driver for the Data API
(`drizzle-orm/aws-data-api/pg`). This proposal surfaces that driver through a
Payload adapter with the same Payload-level surface as `postgresAdapter`.

Requested API from the discussion (adapted to the separate-package design):

```ts
import { auroraServerlessAdapter } from '@payloadcms/db-aurora-serverless'

export default buildConfig({
  db: auroraServerlessAdapter({
    connection: {
      database: process.env.DATABASE!,
      secretArn: process.env.SECRET_ARN!,
      resourceArn: process.env.RESOURCE_ARN!,
      region: process.env.AWS_REGION!,
    },
  }),
})
```

## Background: how the current adapter works

`@payloadcms/db-postgres` is a thin wrapper. Almost all logic lives in
`@payloadcms/drizzle/postgres` (shared with `@payloadcms/db-vercel-postgres`):

- `postgresAdapter(args)` builds an adapter object with shared operations
  (`execute`, `insert`, `count`, `find`, …) from `@payloadcms/drizzle`.
- `connect()` (`packages/db-postgres/src/connect.ts`) does the only
  driver-specific work:
  1. `this.pool = new this.pg.Pool(this.poolOptions)`
  2. `this.drizzle = drizzle({ client: this.pool, logger, schema })` using
     `drizzle-orm/node-postgres`
  3. optional read replicas via `withReplicas`
  4. optional database auto-creation on connect failure
- `destroy()` only clears in-memory state; it does **not** close a pool.

`@payloadcms/db-vercel-postgres` is already a near-verbatim fork of the same
adapter for a different client, which is the established convention for
alternate Postgres transports (`db-d1-sqlite` is the SQLite equivalent).

### How the Data API driver differs

From `drizzle-orm/aws-data-api/pg`:

- The client is an **`RDSDataClient`** (stateless HTTP), not a pool. Each query
  is an `ExecuteStatementCommand`.
- Construction:
  `drizzle({ connection: { database, resourceArn, secretArn, region, ... } })`
  or `drizzle({ client, database, resourceArn, secretArn })`.
- Database type is `AwsDataApiPgDatabase<TSchema>` (still extends `PgDatabase`,
  so `.select/.insert/.update/.delete/.transaction/.execute` are all present).
- Interactive transactions are supported natively: the session issues
  `BeginTransactionCommand`, reuses `transactionId` for each statement, then
  `CommitTransactionCommand` / `RollbackTransactionCommand`.
- The dialect (`AwsPgDialect`) uses `:1, :2, …` placeholders instead of `$1`
  and casts array params to their SQL type. This is handled internally by
  Drizzle, so Payload's query builder needs no changes.
- Query results have a different shape than `pg`'s `QueryResult`
  (`numberOfRecordsUpdated` instead of `rowCount`, plus
  `records`/`columnMetadata`).

## Proposed architecture

New package `packages/db-aurora-serverless`:

```
packages/db-aurora-serverless/
├── package.json          # + @aws-sdk/client-rds-data dep, no pg pool
├── tsconfig.json
├── src/
│   ├── index.ts          # adapter factory, mirrors db-postgres
│   ├── connect.ts        # Data API-specific
│   ├── types.ts
│   ├── createDatabase.ts # Data API-specific (unsupported / no-op)
│   ├── dropDatabase.ts   # single-statement variant
│   ├── drizzle-proxy/    # re-export drizzle + pg-core (+ aws driver)
│   ├── exports/migration-utils.ts
│   └── predefinedMigrations/
└── ...
```

Everything except `connect.ts` / `createDatabase.ts` / `dropDatabase.ts` is
imported from `@payloadcms/drizzle` and `@payloadcms/drizzle/postgres`, exactly
like `db-vercel-postgres`. The adapter casts the AWS database instance to the
shared `PostgresDB` type at the boundary (runtime interface is the same).

### Why a separate package instead of extending `postgresAdapter`

- Follows existing convention (`db-vercel-postgres`, `db-d1-sqlite`,
  `db-sqlite`); no precedent for driver fan-out inside one adapter package.
- Keeps `@aws-sdk/client-rds-data` out of every `db-postgres` install.
- The `pool`/`NodePgDatabase` typing is pervasive in `db-postgres`; a union
  driver type would ripple through `@payloadcms/drizzle`'s public types.
- Independent versioning and docs.

The trade-off is the same duplication `db-vercel-postgres` already accepts
(~250 lines of adapter wiring). If maintainers prefer a single adapter, the
same internal `connect.ts` branch can be lifted into `db-postgres` later
without changing the public API proposed here.

## Public API

```ts
type Connection = {
  /** Database name. */
  database: string
  /** ARN of the Aurora/RDS cluster. */
  resourceArn: string
  /** ARN of the Secrets Manager secret with DB credentials. */
  secretArn: string
  /** AWS region; falls back to the SDK default chain. */
  region?: string
  /** Any additional RDSDataClientConfig (endpoint, credentials, …). */
  [key: string]: unknown
}

type Args = {
  connection: Connection
  /** Not supported by the Data API; defaults to `true`. */
  disableCreateDatabase?: boolean
  schemaName?: string
  extensions?: string[]
  push?: boolean
  prodMigrations?: { down; name; up }[]
  migrationDir?: string
  idType?: 'serial' | 'uuid' | 'uuidv7'
  afterSchemaInit?: PostgresSchemaHook[]
  beforeSchemaInit?: PostgresSchemaHook[]
  blocksAsJSON?: boolean
  localesSuffix?: string
  relationshipsSuffix?: string
  versionsSuffix?: string
  tablesFilter?: string[]
  transactionOptions?: false | PgTransactionConfig
  logger?: DrizzleConfig['logger']
  query?: PostgresQueryConfig
  generateSchemaOutputFile?: string
  allowIDOnCreate?: boolean
  // readReplicas / readReplicasAfterWriteInterval: intentionally omitted
}
```

## Compatibility notes & mitigations

| Area                      | Constraint                                                                                                                                                                                                                 | Mitigation                                                                                                                                                          |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Connection lifecycle      | No pool; `connectWithReconnect` N/A                                                                                                                                                                                        | `connect()` just instantiates the `RDSDataClient`; no error-listener/reconnect loop. `destroy()` already only clears state.                                         |
| Auto DB creation          | Data API cannot run `CREATE DATABASE` (and the target DB is fixed by the ARN/secret)                                                                                                                                       | Provide a `createDatabase` that logs a clear error and returns `false`; default `disableCreateDatabase: true`. Docs tell users to create the DB/schema out-of-band. |
| Multi-statement `execute` | `ExecuteStatement` accepts a **single** statement; `dropDatabase` currently sends `drop schema …; create schema …`                                                                                                         | Ship a Data API `dropDatabase` that runs each statement separately.                                                                                                 |
| `rowCount`                | AWS result exposes `numberOfRecordsUpdated`                                                                                                                                                                                | One predefined migration (`migrateLocalizeStatus`) reads `deleteResult.rowCount`; normalise or guard. Core CRUD does not use `rowCount`.                            |
| Read replicas             | Data API has no replica routing                                                                                                                                                                                            | Omit `readReplicas`; document as unsupported.                                                                                                                       |
| `push` (dev schema)       | `drizzle-kit` `pushSchema` calls `drizzleInstance.execute(sql.raw(query)).rows`; works over the driver, but every introspection/DDL statement is a paid round-trip and subject to the 1 MiB response / 4 MB request limits | Leave `push` working but document it; recommend migrations for production.                                                                                          |
| DDL limitations           | Data API runs DDL, but statements like `CREATE INDEX CONCURRENTLY` are disallowed, and each statement is its own transaction                                                                                               | Document; Payload's generated schema uses standard DDL.                                                                                                             |
| `CREATE EXTENSION`        | Runs against `this.drizzle.execute`                                                                                                                                                                                        | Works for permitted extensions; existing error handling is reused.                                                                                                  |
| Arrays                    | `AwsPgDialect` casts array params                                                                                                                                                                                          | Handled by Drizzle; no Payload change.                                                                                                                              |
| Result rows               | `execute.rows` is present on both drivers                                                                                                                                                                                  | Shared code already only reads `.rows` (plus the one `rowCount` case above).                                                                                        |
| Cost/perf                 | Per-query HTTP latency, no pipelining                                                                                                                                                                                      | Trade-off for scale-to-zero; document CloudFront/cold-path implications.                                                                                            |

## Testing strategy

- **Unit**: schema generation, query building and `dropDatabase` statement
  splitting without a live AWS account. Mock `RDSDataClient` with
  [`aws-sdk-client-mock`](https://github.com/m-radzikowski/aws-sdk-client-mock)
  to assert `ExecuteStatementCommand` SQL/parameters (e.g. `:1` placeholders,
  array casts) and transaction commands (`Begin/Commit/Rollback`).
- **Adapter wiring**: type-check that `auroraServerlessAdapter` satisfies
  `DatabaseAdapterObj` and that the shared operations are assigned.
- **Live (optional / manual)**: a real Aurora Serverless v2 cluster with the
  Data API enabled; run a minimal collection CRUD + migrate cycle. There is no
  reliable local emulator for the Data API, so this stays opt-in.
- Add a `test/database/aurora-serverless` suite that is skipped unless
  `AURORA_*`/`AWS_*` env vars are present.

## Open questions

1. Package name: `db-aurora-serverless` vs `db-aws-data-api`? The driver also
   serves provisioned Aurora and RDS, so the latter is more accurate; the
   former is more discoverable.
2. Should `connection` accept a pre-built `RDSDataClient` for credential
   providers / instrumentation, mirroring `db-postgres`' `pg` injection?
3. Do we want to support `readReplicas` by accepting multiple connection
   configs, or explicitly not?
4. Should `push` be disabled by default for this adapter (cost + limits) while
   still allowing `PAYLOAD_FORCE_DRIZZLE_PUSH`?
5. Error mapping: RDS Data API returns database errors wrapped in AWS SDK
   exceptions; confirm unique-constraint handling in `upsertRow` / `parseError`
   still extracts enough information to produce Payload's friendly errors.

## Rollout

1. Land the package + docs page (`docs/database/aurora-serverless.mdx`).
2. Add to the adapter overview and README tables.
3. Add a `build:db-aurora-serverless` script and Turbo wiring.
4. Follow-up: consider hoisting the driver branch into `db-postgres` if the
   duplication proves burdensome.

## References

- Discussion: https://github.com/payloadcms/payload/discussions/10566
- Drizzle AWS Data API driver docs: https://orm.drizzle.team/docs/connect-aws-data-api
- AWS RDS Data API: https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/data-api.html
- Existing sibling adapter: `packages/db-vercel-postgres`
