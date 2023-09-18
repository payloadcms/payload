import type { Configuration } from 'webpack'

import type { TypeWithID } from '../collections/config/types'
import type { TypeWithID as GlobalsTypeWithID } from '../globals/config/types'
import type { Payload } from '../payload'
import type { Document, PayloadRequest, Where } from '../types'
import type { TypeWithVersion } from '../versions/types'

export interface DatabaseAdapter {
  /**
   * Start a transaction, requiring commitTransaction() to be called for any changes to be made.
   * @returns an identifier for the transaction or null if one cannot be established
   */
  beginTransaction?: BeginTransaction
  /**
   * Persist the changes made since the start of the transaction.
   */
  commitTransaction?: CommitTransaction

  /**
   * Open the connection to the database
   */
  connect?: Connect

  create: Create

  createGlobal: CreateGlobal

  // migrations
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

  // operations
  find: <T = TypeWithID>(args: FindArgs) => Promise<PaginatedDocs<T>>

  // operations - globals
  findGlobal: FindGlobal

  // transactions
  findGlobalVersions: FindGlobalVersions

  findOne: FindOne
  // versions
  findVersions: FindVersions

  /**
   * Perform startup tasks required to interact with the database such as building Schema and models
   */
  init?: Init

  /**
   * Run any migration up functions that have not yet been performed and update the status
   */
  migrate: () => Promise<void>

  /**
   * Run any migration down functions that have been performed
   */
  migrateDown: () => Promise<void>

  /**
   * Drop the current database and run all migrate up functions
   */
  migrateFresh: () => Promise<void>
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
  migrationDir?: string
  /**
   * reference to the instance of payload
   */
  payload: Payload

  queryDrafts: QueryDrafts
  /**
   * Abort any changes since the start of the transaction.
   */
  rollbackTransaction?: RollbackTransaction
  /**
   * Perform many database interactions in a single, all-or-nothing operation.
   */
  transaction?: Transaction

  updateGlobal: UpdateGlobal
  updateOne: UpdateOne
  updateVersion: UpdateVersion
  /**
   * assign the transaction to use when making queries, defaults to the last started transaction
   */
  useTransaction?: (id: number | string) => void
  /**
   * Used to alias server only modules or make other changes to webpack configuration
   */
  webpack?: Webpack
}

export type Init = (payload: Payload) => Promise<void>

export type Connect = (payload: Payload) => Promise<void>

export type Destroy = (payload: Payload) => Promise<void>

export type Webpack = (config: Configuration) => Configuration

export type CreateMigration = (
  payload: Payload,
  migrationDir?: string,
  migrationName?: string,
) => Promise<void>

export type Transaction = (
  callback: () => Promise<void>,
  options?: Record<string, unknown>,
) => Promise<void>

export type BeginTransaction = (
  options?: Record<string, unknown>,
) => Promise<null | number | string>

export type RollbackTransaction = (id: number | string) => Promise<void>

export type CommitTransaction = (id: number | string) => Promise<void>

export type QueryDraftsArgs = {
  collection: string
  limit?: number
  locale?: string
  page?: number
  pagination?: boolean
  req?: PayloadRequest
  sort?: string
  where?: Where
}

export type QueryDrafts = <T = TypeWithID>(args: QueryDraftsArgs) => Promise<PaginatedDocs<T>>

export type FindOneArgs = {
  collection: string
  locale?: string
  req?: PayloadRequest
  where?: Where
}

export type FindOne = <T = TypeWithID>(args: FindOneArgs) => Promise<T | null>

export type FindArgs = {
  collection: string
  /** Setting limit to 1 is equal to the previous Model.findOne(). Setting limit to 0 disables the limit */
  limit?: number
  locale?: string
  page?: number
  pagination?: boolean
  req?: PayloadRequest
  skip?: number
  sort?: string
  versions?: boolean
  where?: Where
}

export type Find = <T = TypeWithID>(args: FindArgs) => Promise<PaginatedDocs<T>>

export type FindVersionsArgs = {
  collection: string
  limit?: number
  locale?: string
  page?: number
  pagination?: boolean
  req?: PayloadRequest
  skip?: number
  sort?: string
  versions?: boolean
  where?: Where
}

export type FindVersions = <T = TypeWithID>(
  args: FindVersionsArgs,
) => Promise<PaginatedDocs<TypeWithVersion<T>>>

export type FindGlobalVersionsArgs = {
  global: string
  limit?: number
  locale?: string
  page?: number
  pagination?: boolean
  req?: PayloadRequest
  skip?: number
  sort?: string
  versions?: boolean
  where?: Where
}

export type FindGlobalArgs = {
  locale?: string
  req?: PayloadRequest
  slug: string
  where?: Where
}

export type FindGlobal = <T extends GlobalsTypeWithID = any>(args: FindGlobalArgs) => Promise<T>

export type CreateGlobalArgs<T extends GlobalsTypeWithID = any> = {
  data: T
  req?: PayloadRequest
  slug: string
}
export type CreateGlobal = <T extends GlobalsTypeWithID = any>(
  args: CreateGlobalArgs<T>,
) => Promise<T>

export type UpdateGlobalArgs<T extends GlobalsTypeWithID = any> = {
  data: T
  req?: PayloadRequest
  slug: string
}
export type UpdateGlobal = <T extends GlobalsTypeWithID = any>(
  args: UpdateGlobalArgs<T>,
) => Promise<T>
// export type UpdateOne = (args: UpdateOneArgs) => Promise<Document>

export type FindGlobalVersions = <T = TypeWithID>(
  args: FindGlobalVersionsArgs,
) => Promise<PaginatedDocs<TypeWithVersion<T>>>

export type DeleteVersionsArgs = {
  collection: string
  locale?: string
  req?: PayloadRequest
  sort?: {
    [key: string]: string
  }
  where: Where
}

export type CreateVersionArgs<T = TypeWithID> = {
  autosave: boolean
  collectionSlug: string
  createdAt: string
  /** ID of the parent document for which the version should be created for */
  parent: number | string
  req?: PayloadRequest
  updatedAt: string
  versionData: T
}

export type CreateVersion = <T = TypeWithID>(
  args: CreateVersionArgs<T>,
) => Promise<TypeWithVersion<T>>

export type DeleteVersions = (args: DeleteVersionsArgs) => Promise<void>

export type UpdateVersionArgs<T = TypeWithID> = {
  collectionSlug: string
  locale?: string
  req?: PayloadRequest
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

export type UpdateVersion = <T = TypeWithID>(
  args: UpdateVersionArgs<T>,
) => Promise<TypeWithVersion<T>>

export type CreateArgs = {
  collection: string
  data: Record<string, unknown>
  draft?: boolean
  locale?: string
  req?: PayloadRequest
}

export type Create = (args: CreateArgs) => Promise<Document>

export type UpdateOneArgs = {
  collection: string
  data: Record<string, unknown>
  draft?: boolean
  locale?: string
  req?: PayloadRequest
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

export type UpdateOne = (args: UpdateOneArgs) => Promise<Document>

export type DeleteOneArgs = {
  collection: string
  req?: PayloadRequest
  where: Where
}

export type DeleteOne = (args: DeleteOneArgs) => Promise<Document>

export type DeleteManyArgs = {
  collection: string
  req?: PayloadRequest
  where: Where
}

export type DeleteMany = (args: DeleteManyArgs) => Promise<void>

export type Migration = MigrationData & {
  down: ({ payload }: { payload }) => Promise<boolean>
  up: ({ payload }: { payload }) => Promise<boolean>
}

export type MigrationData = {
  batch: number
  id: string
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
