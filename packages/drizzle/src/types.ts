import type { AnyRelations, Column, DrizzleConfig, SQL, TableRelationalConfig } from 'drizzle-orm'
import type { LibSQLDatabase } from 'drizzle-orm/libsql'
import type { NodePgDatabase, NodePgQueryResultHKT } from 'drizzle-orm/node-postgres'
import type {
  PgAsyncTransaction,
  PgColumn,
  PgTable,
  Precision,
  UpdateDeleteAction,
} from 'drizzle-orm/pg-core'
import type {
  Result,
  SQLiteAsyncTransaction,
  SQLiteColumn,
  SQLiteTable,
} from 'drizzle-orm/sqlite-core'
import type {
  BaseDatabaseAdapter,
  FlattenedField,
  MigrationData,
  Payload,
  PayloadRequest,
} from 'payload'

import type { BuildQueryJoinAliases } from './queries/buildQuery.js'

export { BuildQueryJoinAliases }

import type { ResultSet } from '@libsql/client'
import type { SQLiteRaw } from 'drizzle-orm/sqlite-core/query-builders/raw'
import type { QueryResult } from 'pg'

import type { Operators } from './queries/operatorMap.js'

/**
 * In drizzle-kit v1 the snapshot shape is dialect-specific and no longer exported
 * from a shared `drizzle-kit/api` entry. Payload only passes snapshots through the
 * drizzle-kit programmatic API, so a structural passthrough type is sufficient.
 */
export type DrizzleSnapshotJSON = Record<string, any>

export type PostgresDB = NodePgDatabase<AnyRelations>

export type SQLiteDB = LibSQLDatabase<AnyRelations>

export type GenericPgColumn = PgColumn

export type GenericColumns<T> = {
  [x: string]: T
}

type GenericPgTable = PgTable<{
  columns: GenericColumns<GenericPgColumn>
  dialect: string
  name: string
  schema: undefined
}>

type GenericSQLiteTable = SQLiteTable<{
  columns: GenericColumns<SQLiteColumn>
  dialect: string
  name: string
  schema: undefined
}>

export type GenericColumn = GenericPgColumn | SQLiteColumn

export type GenericTable = GenericPgTable | GenericSQLiteTable

/**
 * Drizzle v1 (RQB v2) relational config for a single table, produced by `defineRelations`.
 */
export type GenericRelation = TableRelationalConfig

export type TransactionSQLite = SQLiteAsyncTransaction<
  'async',
  Result<'async', unknown>,
  AnyRelations
>
export type TransactionPg = PgAsyncTransaction<NodePgQueryResultHKT, AnyRelations>

export type DrizzleTransaction = TransactionPg | TransactionSQLite

export type CountDistinct = (args: {
  column?: PgColumn<any> | SQLiteColumn<any>
  db: DrizzleTransaction | LibSQLDatabase | PostgresDB
  joins: BuildQueryJoinAliases
  tableName: string
  where: SQL
}) => Promise<number>

export type DeleteWhere = (args: {
  db: DrizzleTransaction | LibSQLDatabase | PostgresDB
  tableName: string
  where: SQL
}) => Promise<void>

export type DropDatabase = (args: { adapter: DrizzleAdapter }) => Promise<void>

export type Execute<T> = (args: {
  db?: DrizzleTransaction | LibSQLDatabase | PostgresDB
  drizzle?: LibSQLDatabase | PostgresDB
  raw?: string
  sql?: SQL<unknown>
}) =>
  | Promise<QueryResult<Record<string, T>>>
  | SQLiteRaw<Promise<{ rows: T[] }>>
  | SQLiteRaw<ResultSet>

export type Insert = (args: {
  db: DrizzleTransaction | LibSQLDatabase | PostgresDB
  onConflictDoUpdate?: unknown
  tableName: string
  values: Record<string, unknown> | Record<string, unknown>[]
}) => Promise<Record<string, unknown>[]>

/**
 * drizzle-kit v1 replaced the separate `filterSchema`/`tablesFilter`/`extensionsFilter`
 * push arguments with a single entities-filter config, and `pushSchema` now returns
 * `hints` instead of `warnings`/`hasDataLoss`.
 */
export type EntitiesFilterConfig = {
  entities?: unknown
  extensions?: string[]
  schemas?: string | string[]
  tables?: string | string[]
}

export type RequireDrizzleKit = () => {
  generateDrizzleJson: (
    args: Record<string, unknown>,
    prevId?: string,
    schemaFilters?: string[],
  ) => DrizzleSnapshotJSON | Promise<DrizzleSnapshotJSON>
  generateMigration: (prev: DrizzleSnapshotJSON, cur: DrizzleSnapshotJSON) => Promise<string[]>
  pushSchema: (
    schema: Record<string, unknown>,
    drizzle: DrizzleAdapter['drizzle'],
    entitiesConfig?: EntitiesFilterConfig,
    migrationsConfig?: { schema?: string; table?: string },
  ) => Promise<{
    apply: () => Promise<void>
    hints: { hint: string; statement?: string }[]
    sqlStatements: string[]
  }>
  upSnapshot?: (snapshot: Record<string, unknown>) => DrizzleSnapshotJSON
}

export type Migration = {
  down: ({
    db,
    payload,
    req,
  }: {
    db?: DrizzleTransaction | LibSQLDatabase<Record<string, never>> | PostgresDB
    payload: Payload
    req: PayloadRequest
  }) => Promise<void>
  up: ({
    db,
    payload,
    req,
  }: {
    db?: DrizzleTransaction | LibSQLDatabase | PostgresDB
    payload: Payload
    req: PayloadRequest
  }) => Promise<void>
} & MigrationData

export type CreateJSONQueryArgs = {
  column?: Column | string
  operator: string
  pathSegments: string[]
  rawColumn?: SQL<unknown>
  table?: string
  treatAsArray?: string[]
  treatRootAsArray?: boolean
  value: boolean | number | number[] | string | string[]
}

/**
 * Abstract relation link
 */
export type RawRelation =
  | {
      fields: { name: string; table: string }[]
      references: string[]
      relationName?: string
      to: string
      type: 'one'
    }
  | {
      relationName?: string
      to: string
      type: 'many'
    }

/**
 * Abstract SQL table that later gets converted by database specific implementation to Drizzle
 */
export type RawTable = {
  columns: Record<string, RawColumn>
  foreignKeys?: Record<string, RawForeignKey>
  indexes?: Record<string, RawIndex>
  name: string
}

/**
 * Abstract SQL foreign key that later gets converted by database specific implementation to Drizzle
 */
export type RawForeignKey = {
  columns: string[]
  foreignColumns: { name: string; table: string }[]
  name: string
  onDelete?: UpdateDeleteAction
  onUpdate?: UpdateDeleteAction
}

/**
 * Abstract SQL index that later gets converted by database specific implementation to Drizzle
 */
export type RawIndex = {
  name: string
  on: string | string[]
  unique?: boolean
}

/**
 * Abstract SQL column that later gets converted by database specific implementation to Drizzle
 */
export type BaseRawColumn = {
  default?: any
  name: string
  notNull?: boolean
  primaryKey?: boolean
  reference?: {
    name: string
    onDelete: UpdateDeleteAction
    table: string
  }
}

/**
 * Postgres: native timestamp type
 * SQLite: text column, defaultNow achieved through strftime('%Y-%m-%dT%H:%M:%fZ', 'now'). withTimezone/precision have no any effect.
 */
export type TimestampRawColumn = {
  defaultNow?: boolean
  mode: 'date' | 'string'
  precision: Precision
  type: 'timestamp'
  withTimezone?: boolean
} & BaseRawColumn

/**
 * Postgres: native UUID type and db lavel defaultRandom
 * SQLite: text type and defaultRandom in the app level
 */
export type UUIDRawColumn = {
  defaultRandom?: boolean
  /** App-side UUID v7 default (Postgres & SQLite); mutually exclusive with defaultRandom in practice */
  defaultV7?: boolean
  type: 'uuid'
} & BaseRawColumn

/**
 * Accepts either `locale: true` to have options from locales or `options` string array
 * Postgres: native enums
 * SQLite: text column with checks.
 */
export type EnumRawColumn = (
  | {
      enumName: string
      options: string[]
      type: 'enum'
    }
  | {
      locale: true
      type: 'enum'
    }
) &
  BaseRawColumn

export type IntegerRawColumn = {
  /**
   * SQLite only.
   * Enable [AUTOINCREMENT](https://www.sqlite.org/autoinc.html) for primary key to ensure that the same ID cannot be reused from previously deleted rows.
   */
  autoIncrement?: boolean
  type: 'integer'
} & BaseRawColumn

export type VectorRawColumn = {
  dimensions?: number
  type: 'vector'
} & BaseRawColumn

export type HalfVecRawColumn = {
  dimensions?: number
  type: 'halfvec'
} & BaseRawColumn

export type SparseVecRawColumn = {
  dimensions?: number
  type: 'sparsevec'
} & BaseRawColumn

export type BinaryVecRawColumn = {
  dimensions?: number
  type: 'bit'
} & BaseRawColumn

export type RawColumn =
  | ({
      type: 'boolean' | 'geometry' | 'jsonb' | 'numeric' | 'serial' | 'text' | 'varchar'
    } & BaseRawColumn)
  | BinaryVecRawColumn
  | EnumRawColumn
  | HalfVecRawColumn
  | IntegerRawColumn
  | SparseVecRawColumn
  | TimestampRawColumn
  | UUIDRawColumn
  | VectorRawColumn

export type IDType = 'integer' | 'numeric' | 'text' | 'uuid' | 'varchar'

export type SetColumnID = (args: {
  adapter: DrizzleAdapter
  columns: Record<string, RawColumn>
  fields: FlattenedField[]
}) => IDType

export type ColumnToCodeConverter = (args: {
  adapter: DrizzleAdapter
  addEnum: (name: string, options: string[]) => void
  addImport: (from: string, name: string) => void
  circularEdges?: Set<string>
  column: RawColumn
  locales?: string[]
  tableKey: string
}) => string

export type BuildDrizzleTable<T extends DrizzleAdapter = DrizzleAdapter> = (args: {
  adapter: T
  locales: string[]
  rawTable: RawTable
}) => void

export type BlocksToJsonBlockToMigrate = {
  data: Record<string, unknown> | Record<string, unknown>[]
  fieldAccessor: (number | string)[]
}

export interface BaseBlocksToJsonEntityToMigrate {
  blocks: BlocksToJsonBlockToMigrate[]
  originalData: Record<string, any>
}

export interface CollectionOrVersionBlocksToJsonEntityToMigrate
  extends BaseBlocksToJsonEntityToMigrate {
  id: number | string
  slug: string
  type: 'collection' | 'collectionVersion' | 'globalVersion'
}

export interface GlobalBlocksToJsonEntityToMigrate extends BaseBlocksToJsonEntityToMigrate {
  slug: string
  type: 'global'
}

export type BlocksToJsonEntityToMigrate =
  | CollectionOrVersionBlocksToJsonEntityToMigrate
  | GlobalBlocksToJsonEntityToMigrate

export interface BlocksToJsonMigrator {
  collectAndSaveEntitiesToBatches(
    req: PayloadRequest,
    options?: {
      batchSize?: number
    },
  ): Promise<void>
  getMigrationStatements(): Promise<{
    statements: string
    writeDrizzleSnapshot(filePath: string): void
  }>
  migrateEntitiesFromTempFolder(
    req: PayloadRequest,
    options?: {
      clearBatches?: boolean
    },
  ): Promise<void>
  setTempFolder(tempFolderPath: string): void
  updatePayloadConfigFile(): Promise<void>
}

export interface DrizzleAdapter extends BaseDatabaseAdapter {
  blocksAsJSON?: boolean
  blocksToJsonMigrator?: BlocksToJsonMigrator
  convertPathToJSONTraversal?: (incomingSegments: string[]) => string
  countDistinct: CountDistinct
  createJSONQuery: (args: CreateJSONQueryArgs) => string
  defaultDrizzleSnapshot: Record<string, unknown>
  deleteWhere: DeleteWhere
  drizzle: LibSQLDatabase | PostgresDB
  dropDatabase: DropDatabase
  enums?: never | Record<string, unknown>
  execute: Execute<unknown>
  features: {
    json?: boolean
  }
  /**
   * An object keyed on each table, with a key value pair where the constraint name is the key, followed by the dot-notation field name
   * Used for returning properly formed errors from unique fields
   */
  fieldConstraints: Record<string, Record<string, string>>

  foreignKeys: Set<string>
  idType: 'serial' | 'uuid' | 'uuidv7'
  indexes: Set<string>
  initializing: Promise<void>
  insert: Insert
  /**
   * Timestamp (ms) of the last write operation. When read replicas are configured,
   * reads within `readReplicasAfterWriteInterval` ms of this timestamp are routed to the
   * primary to guarantee read-after-write consistency.
   */
  lastWriteTimestamp?: number
  limitedBoundParameters?: boolean
  localesSuffix?: string
  logger: DrizzleConfig['logger']
  operators: Operators
  /**
   * When read replicas are configured, holds the unwrapped primary drizzle instance
   * (before withReplicas wrapping). Used for reads that are part of write operations
   * to avoid replication lag.
   */
  primaryDrizzle?: PostgresDB
  push: boolean
  rawRelations: Record<string, Record<string, RawRelation>>
  rawTables: Record<string, RawTable>
  /**
   * How long (ms) after a write to route reads to the primary instead of a
   * read replica. Avoids stale reads caused by replication lag.
   * @default 2000
   */
  readReplicasAfterWriteInterval: number

  rejectInitializing: () => void
  relations: Record<string, GenericRelation>
  relationshipsSuffix?: string
  requireDrizzleKit: RequireDrizzleKit
  resolveInitializing: () => void

  schema: Record<string, unknown>

  schemaName?: string
  sessions: {
    [id: string]: {
      db: DrizzleTransaction
      reject: () => Promise<void>
      resolve: () => Promise<void>
    }
  }
  tableNameMap: Map<string, string>
  tables: Record<string, any>
  transactionOptions: unknown
  versionsSuffix?: string
}

export type RelationMap = Map<
  string,
  {
    localized: boolean
    relationName?: string
    target: string
    type: 'many' | 'one'
  }
>
