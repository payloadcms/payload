import type { Pool, PoolConfig } from '@neondatabase/serverless'
import type {
  BasePostgresAdapter,
  GenericEnum,
  MigrateDownArgs,
  MigrateUpArgs,
  PostgresSchemaHook,
} from '@payloadcms/drizzle/postgres'
import type { DrizzleAdapter } from '@payloadcms/drizzle/types'
import type { DrizzleConfig } from 'drizzle-orm'
import type { NeonDatabase } from 'drizzle-orm/neon-serverless'
import type { PgSchema, PgTableFn, PgTransactionConfig } from 'drizzle-orm/pg-core'

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
  connectionString?: string
  /**
   * Pass `true` to disale auto database creation if it doesn't exist.
   * @default false
   */
  disableCreateDatabase?: boolean
  extensions?: string[]
  /**
   * By default, we connect to a local database using the `pg` module instead of `@neondatabase/serverless`.
   * If you still want to use `@neondatabase/serverless` even locally you can pass `true` here.
   */
  forceUseVercelPostgres?: boolean
  /** Generated schema from payload generate:db-schema file path */
  generateSchemaOutputFile?: string
  idType?: 'serial' | 'uuid' | 'uuidv7'
  localesSuffix?: string
  logger?: DrizzleConfig['logger']
  migrationDir?: string
  /**
   * Optional pool configuration
   * If not provided, will attempt to use the Vercel/Neon environment variables
   */
  pool?: PoolConfig
  prodMigrations?: {
    down: (args: MigrateDownArgs) => Promise<void>
    name: string
    up: (args: MigrateUpArgs) => Promise<void>
  }[]
  push?: boolean
  readReplicas?: string[]
  /**
   * How long (ms) after a write to keep routing reads to the primary instead
   * of a read replica. Prevents stale reads caused by replication lag.
   * Only relevant when `readReplicas` is set.
   * @default 2000
   */
  readReplicasAfterWriteInterval?: number
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

type ResolveSchemaType<T> = 'schema' extends keyof T
  ? T['schema']
  : GeneratedDatabaseSchema['schemaUntyped']

type Drizzle = NeonDatabase<ResolveSchemaType<GeneratedDatabaseSchema>>

export type VercelPostgresAdapter = {
  drizzle: Drizzle
  forceUseVercelPostgres?: boolean
  pool?: Pool
  poolOptions?: Args['pool']
} & BasePostgresAdapter

declare module 'payload' {
  export interface DatabaseAdapter
    extends Omit<Args, 'idType' | 'logger' | 'migrationDir' | 'pool'>,
      DrizzleAdapter {
    afterSchemaInit: PostgresSchemaHook[]
    beforeSchemaInit: PostgresSchemaHook[]
    beginTransaction: (options?: PgTransactionConfig) => Promise<null | number | string>
    drizzle: Drizzle
    enums: Record<string, GenericEnum>
    extensions: Record<string, boolean>
    extensionsFilter: Set<string>
    /**
     * An object keyed on each table, with a key value pair where the constraint name is the key, followed by the dot-notation field name
     * Used for returning properly formed errors from unique fields
     */
    fieldConstraints: Record<string, Record<string, string>>
    idType: Args['idType']
    initializing: Promise<void>
    localesSuffix?: string
    logger: DrizzleConfig['logger']
    pgSchema?: { table: PgTableFn } | PgSchema
    pool: Pool
    poolOptions: Args['pool']
    prodMigrations?: {
      down: (args: MigrateDownArgs) => Promise<void>
      name: string
      up: (args: MigrateUpArgs) => Promise<void>
    }[]
    push: boolean
    rejectInitializing: () => void
    relationshipsSuffix?: string
    resolveInitializing: () => void
    schema: Record<string, unknown>
    schemaName?: Args['schemaName']
    tableNameMap: Map<string, string>
    tablesFilter?: string[]
    versionsSuffix?: string
  }
}
