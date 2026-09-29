import type { RDSDataClientConfig } from '@aws-sdk/client-rds-data'
import type { DrizzleAdapter } from '@payloadcms/drizzle'
import type {
  BasePostgresAdapter,
  GenericEnum,
  MigrateDownArgs,
  MigrateUpArgs,
  PostgresDB,
  PostgresQueryConfig,
  PostgresSchemaHook,
} from '@payloadcms/drizzle/postgres'
import type { DrizzleConfig } from 'drizzle-orm'
import type { PgSchema, PgTableFn, PgTransactionConfig } from 'drizzle-orm/pg-core'

/**
 * Connection options for the RDS Data API. `database`, `resourceArn` and `secretArn` are required
 * by the driver; every other `RDSDataClientConfig` option (region, endpoint, credentials, ...) is
 * forwarded to the underlying `RDSDataClient`.
 */
export type AuroraServerlessConnection = {
  database: string
  /** ARN of the Aurora/RDS cluster. */
  resourceArn: string
  /** ARN of the Secrets Manager secret holding the database credentials. */
  secretArn: string
} & RDSDataClientConfig

export type Args = {
  /**
   * Transform the schema after it's built.
   * You can use it to customize the schema with features that aren't supported by Payload.
   * Examples may include: composite indices, generated columns, vectors
   */
  afterSchemaInit?: PostgresSchemaHook[]
  /**
   * Enable this flag if you want to thread your own ID to create operation data, for example:
   * ```ts
   * // doc created with id 1
   * const doc = await payload.create({ collection: 'posts', data: {id: 1, title: "my title"}})
   * ```
   */
  allowIDOnCreate?: boolean
  /**
   * Transform the schema before it's built.
   * You can use it to preserve an existing database schema and if there are any collissions Payload will override them.
   * To generate Drizzle schema from the database, see [Drizzle Kit introspection](https://orm.drizzle.team/kit-docs/commands#introspect--pull)
   */
  beforeSchemaInit?: PostgresSchemaHook[]
  /**
   * Store blocks as JSON column instead of storing them in relational structure.
   */
  blocksAsJSON?: boolean
  /** RDS Data API connection options. */
  connection: AuroraServerlessConnection
  /**
   * The RDS Data API cannot run `CREATE DATABASE`, so this defaults to `true`.
   * Create the database and schema out-of-band before starting Payload.
   * @default true
   */
  disableCreateDatabase?: boolean
  extensions?: string[]
  /** Generated schema from payload generate:db-schema file path */
  generateSchemaOutputFile?: string
  idType?: 'serial' | 'uuid' | 'uuidv7'
  localesSuffix?: string
  logger?: DrizzleConfig['logger']
  migrationDir?: string
  prodMigrations?: {
    down: (args: MigrateDownArgs) => Promise<void>
    name: string
    up: (args: MigrateUpArgs) => Promise<void>
  }[]
  push?: boolean
  /**
   * Customize how Payload's Drizzle query operators (`contains`, `like`, `not_like`, etc.) are
   * built, for example to make text matching accent-insensitive with `postgresUnaccent()`.
   */
  query?: PostgresQueryConfig
  relationshipsSuffix?: string
  /**
   * The schema name to use for the database
   *
   * @experimental This only works when there are not other tables or enums of the same name in the database under a different schema. Awaiting fix from Drizzle.
   */
  schemaName?: string
  tablesFilter?: string[]
  transactionOptions?: false | PgTransactionConfig
  versionsSuffix?: string
}

export interface GeneratedDatabaseSchema {
  schemaUntyped: Record<string, unknown>
}

/**
 * The public adapter type keeps the shared Postgres types. The AWS Data API database instance is
 * structurally compatible at runtime and is cast to `PostgresDB` at the driver boundary
 * (see `connect.ts`), mirroring `db-vercel-postgres`.
 */
type Drizzle = PostgresDB

export type AuroraServerlessAdapter = {
  connection: Args['connection']
  drizzle: Drizzle
} & BasePostgresAdapter

declare module 'payload' {
  export interface DatabaseAdapter
    extends Omit<Args, 'extensions' | 'idType' | 'logger' | 'migrationDir'>,
      DrizzleAdapter {
    afterSchemaInit: PostgresSchemaHook[]
    beforeSchemaInit: PostgresSchemaHook[]
    beginTransaction: (options?: PgTransactionConfig) => Promise<null | number | string>
    connection: Args['connection']
    drizzle: Drizzle
    enums: Record<string, GenericEnum>
    extensions: Record<string, boolean>
    /**
     * An object keyed on each table, with a key value pair where the constraint name is the key, followed by the dot-notation field name
     * Used for returning properly formed errors from unique fields
     */
    fieldConstraints: Record<string, Record<string, string>>
    idType: NonNullable<Args['idType']>
    initializing: Promise<void>
    localesSuffix?: string
    logger: DrizzleConfig['logger']
    pgSchema?: { table: PgTableFn } | PgSchema
    prodMigrations?: {
      down: (args: MigrateDownArgs) => Promise<void>
      name: string
      up: (args: MigrateUpArgs) => Promise<void>
    }[]
    push: boolean
    readReplicasAfterWriteInterval: number
    rejectInitializing: () => void
    relationshipsSuffix?: string
    resolveInitializing: () => void
    schema: Record<string, unknown>
    schemaName?: Args['schemaName']
    sessions: DrizzleAdapter['sessions']
    tableNameMap: Map<string, string>
    tablesFilter?: string[]
    transactionOptions: PgTransactionConfig | undefined
    versionsSuffix?: string
  }
}
