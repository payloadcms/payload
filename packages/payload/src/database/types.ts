import type { TypeWithID } from '../collections/config/types.js'
import type { BaseJob, CollectionSlug, GlobalSlug } from '../index.js'
import type {
  Document,
  JoinQuery,
  Payload,
  PayloadRequest,
  SelectType,
  Sort,
  Where,
} from '../types/index.js'
import type { TypeWithVersion } from '../versions/types.js'

export type { TypeWithVersion }

export interface BaseDatabaseAdapter {
  allowIDOnCreate?: boolean
  /**
   * Start a transaction, requiring commitTransaction() to be called for any changes to be made.
   * @returns an identifier for the transaction or null if one cannot be established
   */
  beginTransaction: BeginTransaction

  /**
   * Persist the changes made since the start of the transaction.
   */
  commitTransaction: CommitTransaction

  /**
   * Open the connection to the database
   */
  connect?: Connect
  count: Count
  countGlobalVersions: CountGlobalVersions

  countVersions: CountVersions

  create: Create

  createGlobal: CreateGlobal
  createGlobalVersion: CreateGlobalVersion

  /**
   * Output a migration file
   */
  createMigration: CreateMigration

  createVersion: CreateVersion

  /**
   * Specify if the ID is a text or number field by default within this database adapter.
   */
  defaultIDType: 'number' | 'text'

  deleteMany: DeleteMany

  deleteOne: DeleteOne
  deleteVersions: DeleteVersions

  /**
   * Terminate the connection with the database
   */
  destroy?: Destroy

  find: Find

  findGlobal: FindGlobal

  findGlobalVersions: FindGlobalVersions

  findOne: FindOne

  findVersions: FindVersions

  generateSchema?: GenerateSchema

  /**
   * Perform startup tasks required to interact with the database such as building Schema and models
   */
  init?: Init

  /**
   * Run any migration up functions that have not yet been performed and update the status
   */
  migrate: (args?: { migrations?: Migration[] }) => Promise<void>

  /**
   * Run any migration down functions that have been performed
   */
  migrateDown: () => Promise<void>
  /**
   * Drop the current database and run all migrate up functions
   */
  migrateFresh: (args: { forceAcceptWarning?: boolean }) => Promise<void>

  /**
   * Run all migration down functions before running up
   */
  migrateRefresh: () => Promise<void>
  /**
   * Run all migrate down functions
   */
  migrateReset: () => Promise<void>
  /**
   * Read the current state of migrations and output the result to show which have been run
   */
  migrateStatus: () => Promise<void>
  /**
   * Path to read and write migration files from
   */
  migrationDir: string

  /**
   * The name of the database adapter
   */
  name: string

  /**
   * Full package name of the database adapter
   *
   * @example @payloadcms/db-postgres
   */
  packageName: string
  /**
   * reference to the instance of payload
   */
  payload: Payload
  queryDrafts: QueryDrafts

  /**
   * Abort any changes since the start of the transaction.
   */
  rollbackTransaction: RollbackTransaction

  /**
   * A key-value store of all sessions open (used for transactions)
   */
  sessions?: {
    [id: string]: {
      db: unknown
      reject: () => Promise<void>
      resolve: () => Promise<void>
    }
  }

  updateGlobal: UpdateGlobal

  updateGlobalVersion: UpdateGlobalVersion

  updateJobs: UpdateJobs

  updateMany: UpdateMany

  updateOne: UpdateOne

  updateVersion: UpdateVersion
  upsert: Upsert
}

export type Init = () => Promise<void> | void

type ConnectArgs = {
  hotReload: boolean
}

export type Connect = (args?: ConnectArgs) => Promise<void>

export type Destroy = () => Promise<void>

export type CreateMigration = (args: {
  file?: string
  forceAcceptWarning?: boolean
  migrationName?: string
  payload: Payload
  /**
   * Skips the prompt asking to create empty migrations
   */
  skipEmpty?: boolean
}) => Promise<void> | void

export type Transaction = (
  callback: () => Promise<void>,
  options?: Record<string, unknown>,
) => Promise<void>

export type BeginTransaction = (
  options?: Record<string, unknown>,
) => Promise<null | number | string>

export type RollbackTransaction = (id: number | Promise<number | string> | string) => Promise<void>

export type CommitTransaction = (id: number | Promise<number | string> | string) => Promise<void>

export type QueryDraftsArgs = {
  collection: CollectionSlug
  joins?: JoinQuery
  limit?: number
  locale?: string
  page?: number
  pagination?: boolean
  req?: Partial<PayloadRequest>
  select?: SelectType
  sort?: Sort
  where?: Where
}

export type QueryDrafts = <T = TypeWithID>(args: QueryDraftsArgs) => Promise<PaginatedDocs<T>>

export type FindOneArgs = {
  collection: CollectionSlug
  draftsEnabled?: boolean
  joins?: JoinQuery
  locale?: string
  req?: Partial<PayloadRequest>
  select?: SelectType
  where?: Where
}

export type FindOne = <T extends TypeWithID>(args: FindOneArgs) => Promise<null | T>

export type FindArgs = {
  collection: CollectionSlug
  draftsEnabled?: boolean
  joins?: JoinQuery
  /** Setting limit to 1 is equal to the previous Model.findOne(). Setting limit to 0 disables the limit */
  limit?: number
  locale?: string
  page?: number
  pagination?: boolean
  projection?: Record<string, unknown>
  req?: Partial<PayloadRequest>
  select?: SelectType
  skip?: number
  sort?: Sort
  versions?: boolean
  where?: Where
}

export type Find = <T = TypeWithID>(args: FindArgs) => Promise<PaginatedDocs<T>>

export type CountArgs = {
  collection: CollectionSlug
  locale?: string
  req?: Partial<PayloadRequest>
  where?: Where
}

export type Count = (args: CountArgs) => Promise<{ totalDocs: number }>

export type CountVersions = (args: CountArgs) => Promise<{ totalDocs: number }>

export type CountGlobalVersionArgs = {
  global: string
  locale?: string
  req?: Partial<PayloadRequest>
  where?: Where
}

export type CountGlobalVersions = (args: CountGlobalVersionArgs) => Promise<{ totalDocs: number }>

type BaseVersionArgs = {
  limit?: number
  locale?: string
  page?: number
  pagination?: boolean
  req?: Partial<PayloadRequest>
  select?: SelectType
  skip?: number
  sort?: Sort
  versions?: boolean
  where?: Where
}

export type FindVersionsArgs = {
  collection: CollectionSlug
} & BaseVersionArgs

export type FindVersions = <T = TypeWithID>(
  args: FindVersionsArgs,
) => Promise<PaginatedDocs<TypeWithVersion<T>>>

export type FindGlobalVersionsArgs = {
  global: GlobalSlug
} & BaseVersionArgs

export type FindGlobalArgs = {
  locale?: string
  req?: Partial<PayloadRequest>
  select?: SelectType
  slug: string
  where?: Where
}

export type UpdateGlobalVersionArgs<T = TypeWithID> = {
  global: GlobalSlug
  locale?: string
  /**
   * Additional database adapter specific options to pass to the query
   */
  options?: Record<string, unknown>
  req?: Partial<PayloadRequest>
  /**
   * If true, returns the updated documents
   *
   * @default true
   */
  returning?: boolean
  select?: SelectType
  versionData: T
} & (
  | {
      id: number | string
      where?: never
    }
  | {
      id?: never
      where: Where
    }
)

/**
 * @todo type as Promise<TypeWithVersion<T> | null> in 4.0
 */
export type UpdateGlobalVersion = <T extends TypeWithID = TypeWithID>(
  args: UpdateGlobalVersionArgs<T>,
) => Promise<TypeWithVersion<T>>

export type FindGlobal = <T extends Record<string, unknown> = any>(
  args: FindGlobalArgs,
) => Promise<T>

export type CreateGlobalArgs<T extends Record<string, unknown> = any> = {
  data: T
  req?: Partial<PayloadRequest>
  /**
   * If true, returns the updated documents
   *
   * @default true
   */
  returning?: boolean
  slug: string
}
export type CreateGlobal = <T extends Record<string, unknown> = any>(
  args: CreateGlobalArgs<T>,
) => Promise<T>

export type UpdateGlobalArgs<T extends Record<string, unknown> = any> = {
  data: T
  /**
   * Additional database adapter specific options to pass to the query
   */
  options?: Record<string, unknown>
  req?: Partial<PayloadRequest>
  /**
   * If true, returns the updated documents
   *
   * @default true
   */
  returning?: boolean
  select?: SelectType
  slug: string
}
/**
 * @todo type as Promise<T | null> in 4.0
 */
export type UpdateGlobal = <T extends Record<string, unknown> = any>(
  args: UpdateGlobalArgs<T>,
) => Promise<T>
// export type UpdateOne = (args: UpdateOneArgs) => Promise<Document>

export type FindGlobalVersions = <T = TypeWithID>(
  args: FindGlobalVersionsArgs,
) => Promise<PaginatedDocs<TypeWithVersion<T>>>

export type DeleteVersionsArgs = {
  collection: CollectionSlug
  locale?: string
  req?: Partial<PayloadRequest>
  sort?: {
    [key: string]: string
  }
  where: Where
}

export type CreateVersionArgs<T = TypeWithID> = {
  autosave: boolean
  collectionSlug: CollectionSlug
  createdAt: string
  /** ID of the parent document for which the version should be created for */
  parent: number | string
  publishedLocale?: string
  req?: Partial<PayloadRequest>
  /**
   * If true, returns the updated documents
   *
   * @default true
   */
  returning?: boolean
  select?: SelectType
  snapshot?: true
  updatedAt: string
  versionData: T
}

export type CreateVersion = <T extends TypeWithID = TypeWithID>(
  args: CreateVersionArgs<T>,
) => Promise<TypeWithVersion<T>>

export type CreateGlobalVersionArgs<T = TypeWithID> = {
  autosave: boolean
  createdAt: string
  globalSlug: GlobalSlug
  /** ID of the parent document for which the version should be created for */
  parent: number | string
  publishedLocale?: string
  req?: Partial<PayloadRequest>
  /**
   * If true, returns the updated documents
   *
   * @default true
   */
  returning?: boolean
  select?: SelectType
  snapshot?: true
  updatedAt: string
  versionData: T
}

export type CreateGlobalVersion = <T extends TypeWithID = TypeWithID>(
  args: CreateGlobalVersionArgs<T>,
) => Promise<TypeWithVersion<T>>

export type DeleteVersions = (args: DeleteVersionsArgs) => Promise<void>

export type UpdateVersionArgs<T = TypeWithID> = {
  collection: CollectionSlug
  locale?: string
  /**
   * Additional database adapter specific options to pass to the query
   */
  options?: Record<string, unknown>
  req?: Partial<PayloadRequest>
  /**
   * If true, returns the updated documents
   *
   * @default true
   */
  returning?: boolean
  select?: SelectType
  versionData: T
} & (
  | {
      id: number | string
      where?: never
    }
  | {
      id?: never
      where: Where
    }
)

/**
 * @todo type as Promise<TypeWithVersion<T> | null> in 4.0
 */
export type UpdateVersion = <T extends TypeWithID = TypeWithID>(
  args: UpdateVersionArgs<T>,
) => Promise<TypeWithVersion<T>>

export type CreateArgs = {
  collection: CollectionSlug
  data: Record<string, unknown>
  draft?: boolean
  locale?: string
  req?: Partial<PayloadRequest>
  /**
   * If true, returns the updated documents
   *
   * @default true
   */
  returning?: boolean
  select?: SelectType
}

export type Create = (args: CreateArgs) => Promise<Document>

export type UpdateOneArgs = {
  collection: CollectionSlug
  data: Record<string, unknown>
  draft?: boolean
  joins?: JoinQuery
  locale?: string
  /**
   * Additional database adapter specific options to pass to the query
   */
  options?: Record<string, unknown>
  req?: Partial<PayloadRequest>
  /**
   * If true, returns the updated documents
   *
   * @default true
   */
  returning?: boolean
  select?: SelectType
} & (
  | {
      id: number | string
      where?: never
    }
  | {
      id?: never
      where: Where
    }
)

/**
 * @todo type as Promise<Document | null> in 4.0
 */
export type UpdateOne = (args: UpdateOneArgs) => Promise<Document>

export type UpdateManyArgs = {
  collection: CollectionSlug
  data: Record<string, unknown>
  draft?: boolean
  joins?: JoinQuery
  limit?: number
  locale?: string
  /**
   * Additional database adapter specific options to pass to the query
   */
  options?: Record<string, unknown>
  req?: Partial<PayloadRequest>
  /**
   * If true, returns the updated documents
   *
   * @default true
   */
  returning?: boolean
  select?: SelectType
  sort?: Sort
  where: Where
}

export type UpdateMany = (args: UpdateManyArgs) => Promise<Document[] | null>

export type UpdateJobsArgs = {
  data: Record<string, unknown>
  req?: Partial<PayloadRequest>
  /**
   * If true, returns the updated documents
   *
   * @default true
   */
  returning?: boolean
} & (
  | {
      id: number | string
      limit?: never
      sort?: never
      where?: never
    }
  | {
      id?: never
      limit?: number
      sort?: Sort
      where: Where
    }
)

export type UpdateJobs = (args: UpdateJobsArgs) => Promise<BaseJob[] | null>

export type UpsertArgs = {
  collection: CollectionSlug
  data: Record<string, unknown>
  joins?: JoinQuery
  locale?: string
  req?: Partial<PayloadRequest>
  /**
   * If true, returns the updated documents
   *
   * @default true
   */
  returning?: boolean
  select?: SelectType
  where: Where
}

export type Upsert = (args: UpsertArgs) => Promise<Document>

export type DeleteOneArgs = {
  collection: CollectionSlug
  joins?: JoinQuery
  req?: Partial<PayloadRequest>
  /**
   * If true, returns the updated documents
   *
   * @default true
   */
  returning?: boolean
  select?: SelectType
  where: Where
}

/**
 * @todo type as Promise<Document | null> in 4.0
 */
export type DeleteOne = (args: DeleteOneArgs) => Promise<Document>

export type DeleteManyArgs = {
  collection: CollectionSlug
  joins?: JoinQuery
  req?: Partial<PayloadRequest>
  where: Where
}

export type DeleteMany = (args: DeleteManyArgs) => Promise<void>

export type Migration = {
  down: (args: unknown) => Promise<void>
  up: (args: unknown) => Promise<void>
} & MigrationData

export type MigrationData = {
  batch?: number
  id?: string
  name: string
}

export type PaginatedDocs<T = any> = {
  docs: T[]
  hasNextPage: boolean
  hasPrevPage: boolean
  limit: number
  nextPage?: null | number | undefined
  page?: number
  pagingCounter: number
  prevPage?: null | number | undefined
  totalDocs: number
  totalPages: number
}

export type DatabaseAdapterResult<T = BaseDatabaseAdapter> = {
  allowIDOnCreate?: boolean
  defaultIDType: 'number' | 'text'
  init: (args: { payload: Payload }) => T
  /**
   * The name of the database adapter. For example, "postgres" or "mongoose".
   *
   * @todo make required in 4.0
   */
  name?: string
}

export type DBIdentifierName =
  | ((Args: {
      /** The name of the parent table when using relational DBs */
      tableName?: string
    }) => string)
  | string

export type MigrationTemplateArgs = {
  downSQL?: string
  imports?: string
  packageName?: string
  upSQL?: string
}

export type GenerateSchemaArgs = {
  log?: boolean
  outputFile?: string
  prettify?: boolean
}

export type GenerateSchema = (args?: GenerateSchemaArgs) => Promise<void>
