import type { Configuration } from 'webpack';
import type { TypeWithID } from '../collections/config/types';
import type { TypeWithID as GlobalsTypeWithID } from '../globals/config/types';
import type { Payload } from '../payload';
import type { Document, PayloadRequest, Where } from '../types';
import type { TypeWithVersion } from '../versions/types';

export interface DatabaseAdapter {
  /**
   * reference to the instance of payload
   */
  payload: Payload;
  /**
   * Open the connection to the database
   */
  connect?: Connect;

  /**
   * Perform startup tasks required to interact with the database such as building Schema and models
   */
  init?: Init;

  /**
   * Terminate the connection with the database
   */
  destroy?: Destroy;

  /**
   * Used to alias server only modules or make other changes to webpack configuration
   */
  webpack?: Webpack;

  // migrations
  /**
   * Path to read and write migration files from
   */
  migrationDir?: string;

  /**
   * Output a migration file
   */
  createMigration: (CreateMigrationArgs) => Promise<void>;

  /**
   * Run any migration up functions that have not yet been performed and update the status
   */
  migrate: () => Promise<void>;

  /**
   * Read the current state of migrations and output the result to show which have been run
   */
  migrateStatus: () => Promise<void>;

  /**
   * Run any migration down functions that have been performed
   */
  migrateDown: () => Promise<void>;

  /**
   * Run all migration down functions before running up
   */
  migrateRefresh: () => Promise<void>;

  /**
   * Run all migrate down functions
   */
  migrateReset: () => Promise<void>;

  /**
   * Drop the current database and run all migrate up functions
   */
  migrateFresh: () => Promise<void>;

  // transactions
  /**
   * assign the transaction to use when making queries, defaults to the last started transaction
   */
  useTransaction?: (id: string | number) => void;

  /**
   * Perform many database interactions in a single, all-or-nothing operation.
   */
  transaction?: Transaction;

  /**
   * Start a transaction, requiring commitTransaction() to be called for any changes to be made.
   * @returns an identifier for the transaction or null if one cannot be established
   */
  beginTransaction?: BeginTransaction;

  /**
   * Abort any changes since the start of the transaction.
   */
  rollbackTransaction?: RollbackTransaction;

  /**
   * Persist the changes made since the start of the transaction.
   */
  commitTransaction?: CommitTransaction;

  queryDrafts: QueryDrafts;

  // operations
  find: <T = TypeWithID>(args: FindArgs) => Promise<PaginatedDocs<T>>;
  findOne: FindOne;

  create: Create;
  updateOne: UpdateOne;
  deleteOne: DeleteOne;
  deleteMany: DeleteMany;

  // operations - globals
  findGlobal: FindGlobal;
  createGlobal: CreateGlobal;
  updateGlobal: UpdateGlobal;


  // versions
  findVersions: FindVersions;
  findGlobalVersions: FindGlobalVersions;
  createVersion: CreateVersion;
  updateVersion: UpdateVersion;
  deleteVersions: DeleteVersions;
}

export type Init = (payload: Payload) => Promise<void>;

export type Connect = (payload: Payload) => Promise<void>

export type Destroy = (payload: Payload) => Promise<void>

export type Webpack = (config: Configuration) => Configuration;

export type CreateMigrationArgs = {
  payload: Payload
  migrationDir: string
  migrationName: string
}

export type CreateMigration = (args: CreateMigrationArgs) => Promise<void>

export type Transaction = (callback: () => Promise<void>, options?: Record<string, unknown>) => Promise<void>

export type BeginTransaction = (options?: Record<string, unknown>) => Promise<number | string | null>

export type RollbackTransaction = (id: string | number) => Promise<void>

export type CommitTransaction = (id: string | number) => Promise<void>

export type QueryDraftsArgs = {
  collection: string
  where?: Where
  page?: number
  limit?: number
  pagination?: boolean
  sort?: string
  locale?: string
  req?: PayloadRequest
}

export type QueryDrafts = <T = TypeWithID>(args: QueryDraftsArgs) => Promise<PaginatedDocs<T>>;

export type FindOneArgs = {
  collection: string
  where?: Where
  locale?: string
  req?: PayloadRequest
}


export type FindOne = <T = TypeWithID>(args: FindOneArgs) => Promise<T | null>

export type FindArgs = {
  collection: string
  where?: Where
  page?: number
  skip?: number
  versions?: boolean
  /** Setting limit to 1 is equal to the previous Model.findOne(). Setting limit to 0 disables the limit */
  limit?: number
  pagination?: boolean
  sort?: string
  locale?: string
  req?: PayloadRequest
}

export type Find = <T = TypeWithID>(args: FindArgs) => Promise<PaginatedDocs<T>>;

export type FindVersionsArgs = {
  collection: string
  where?: Where
  page?: number
  skip?: number
  versions?: boolean
  limit?: number
  pagination?: boolean
  sort?: string
  locale?: string
  req?: PayloadRequest
}

export type FindVersions = <T = TypeWithID>(args: FindVersionsArgs) => Promise<PaginatedDocs<TypeWithVersion<T>>>;


export type FindGlobalVersionsArgs = {
  global: string
  where?: Where
  page?: number
  skip?: number
  versions?: boolean
  limit?: number
  pagination?: boolean
  sort?: string
  locale?: string
  req?: PayloadRequest
}

export type FindGlobalArgs = {
  slug: string
  locale?: string
  where?: Where
  req?: PayloadRequest
}

export type FindGlobal = <T extends GlobalsTypeWithID = any>(args: FindGlobalArgs) => Promise<T>


export type CreateGlobalArgs<T extends GlobalsTypeWithID = any> = {
  slug: string
  data: T
  req?: PayloadRequest
}
export type CreateGlobal = <T extends GlobalsTypeWithID = any>(args: CreateGlobalArgs<T>) => Promise<T>


export type UpdateGlobalArgs<T extends GlobalsTypeWithID = any> = {
  slug: string
  data: T
  req?: PayloadRequest
}
export type UpdateGlobal = <T extends GlobalsTypeWithID = any>(args: UpdateGlobalArgs<T>) => Promise<T>
// export type UpdateOne = (args: UpdateOneArgs) => Promise<Document>

export type FindGlobalVersions = <T = TypeWithID>(args: FindGlobalVersionsArgs) => Promise<PaginatedDocs<TypeWithVersion<T>>>;

export type DeleteVersionsArgs = {
  collection: string
  where: Where
  locale?: string
  sort?: {
    [key: string]: string
  }
  req?: PayloadRequest
};

export type CreateVersionArgs<T = TypeWithID> = {
  collectionSlug: string
  /** ID of the parent document for which the version should be created for */
  parent: string | number
  versionData: T
  autosave: boolean
  createdAt: string
  updatedAt: string
  req?: PayloadRequest
}

export type CreateVersion = <T = TypeWithID>(args: CreateVersionArgs<T>) => Promise<TypeWithVersion<T>>;

export type DeleteVersions = (args: DeleteVersionsArgs) => Promise<void>;


export type UpdateVersionArgs<T = TypeWithID> = {
  collectionSlug: string
  where: Where
  locale?: string
  versionData: T
  req?: PayloadRequest
}

export type UpdateVersion = <T = TypeWithID>(args: UpdateVersionArgs<T>) => Promise<TypeWithVersion<T>>


export type CreateArgs = {
  collection: string
  data: Record<string, unknown>
  draft?: boolean
  locale?: string
  req?: PayloadRequest
}

export type Create = (args: CreateArgs) => Promise<Document>

export type UpdateArgs = {
  collection: string
  data: Record<string, unknown>
  where: Where
  draft?: boolean
  locale?: string
  req?: PayloadRequest
}

export type Update = (args: UpdateArgs) => Promise<Document>

export type UpdateOneArgs = {
  collection: string
  data: Record<string, unknown>
  where: Where
  draft?: boolean
  locale?: string
  req?: PayloadRequest
}

export type UpdateOne = (args: UpdateOneArgs) => Promise<Document>

export type DeleteOneArgs = {
  collection: string
  where: Where
  req?: PayloadRequest
}

export type DeleteOne = (args: DeleteOneArgs) => Promise<Document>

export type DeleteManyArgs = {
  collection: string
  where: Where
  req?: PayloadRequest
}

export type DeleteMany = (args: DeleteManyArgs) => Promise<void>


export type Migration = MigrationData & {
  up: ({ payload }: { payload }) => Promise<boolean>
  down: ({ payload }: { payload }) => Promise<boolean>
};

export type MigrationData = {
  id: string
  name: string
  batch: number
}

export type PaginatedDocs<T = any> = {
  docs: T[]
  totalDocs: number
  limit: number
  totalPages: number
  page?: number
  pagingCounter: number
  hasPrevPage: boolean
  hasNextPage: boolean
  prevPage?: number | null | undefined
  nextPage?: number | null | undefined
}
