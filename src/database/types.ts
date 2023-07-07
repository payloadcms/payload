import type { SchemaOptions } from 'mongoose';
import type { Configuration } from 'webpack';
import type { SanitizedConfig } from '../config/types';
import type {
  ArrayField,
  BlockField,
  CheckboxField,
  CodeField,
  CollapsibleField,
  DateField,
  EmailField,
  Field,
  GroupField,
  JSONField,
  NumberField,
  PointField,
  RadioField,
  RelationshipField,
  RichTextField,
  RowField,
  SelectField,
  TabsField,
  TextareaField,
  TextField,
  UploadField,
} from '../fields/config/types';
import type { TypeWithID } from '../collections/config/types';
import type { TypeWithID as GlobalsTypeWithID } from '../globals/config/types';
import type { Payload } from '../payload';
import type { Document, Where } from '../types';
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
  destroy?: () => Promise<void>;

  /**
   * Used to alias server only modules or make other changes to webpack configuration
   */
  webpack?: Webpack;

  // migrations
  /**
   * Path to read and write migration files from
   */
  migrationDir: string;

  /**
   * Output a migration file
   */
  createMigration: (migrationName: string) => Promise<void>;

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
   * Perform many database interactions in a single, all-or-nothing operation.
   */
  transaction?: () => Promise<boolean>;

  /**
   * Start a transaction, requiring commit() to be called for any changes to be made.
   */
  beginTransaction?: () => Promise<boolean>;

  /**
   * Cancel any changes since the beginning of the transaction.
   */
  rollbackTransaction?: () => Promise<boolean>;

  /**
   * Instruct the database to complete the changes made in the transaction.
   */
  commitTransaction?: () => Promise<boolean>;

  queryDrafts: QueryDrafts;

  // operations
  find: <T = TypeWithID>(args: FindArgs) => Promise<PaginatedDocs<T>>;
  findOne: FindOne;

  create: Create;
  updateOne: UpdateOne;
  deleteOne: DeleteOne;

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

export type Init = ({ config }: { config: SanitizedConfig }) => Promise<void>;

export type Connect = ({ config }: { config: SanitizedConfig }) => Promise<void>

export type Webpack = (config: Configuration) => Configuration;

export type QueryDraftsArgs = {
  collection: string
  where?: Where
  page?: number
  limit?: number
  pagination?: boolean
  sort?: string
  locale?: string
}

export type QueryDrafts = <T = TypeWithID>(args: QueryDraftsArgs) => Promise<PaginatedDocs<T>>;

export type FindOneArgs = {
  collection: string
  where?: Where
  locale?: string
}


export type FindOne = <T = TypeWithID>(args: FindOneArgs) => Promise<T|null>

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
}

export type FindGlobalArgs = {
  slug: string
  locale?: string
  where?: Where
}

export type FindGlobal = <T extends GlobalsTypeWithID = any>(args: FindGlobalArgs) => Promise<T>


export type CreateGlobalArgs<T extends GlobalsTypeWithID = any> = {
  slug: string
  data: T
}
export type CreateGlobal = <T extends GlobalsTypeWithID = any>(args: CreateGlobalArgs<T>) => Promise<T>


export type UpdateGlobalArgs<T extends GlobalsTypeWithID = any> = {
  slug: string
  data: T
}
export type UpdateGlobal = <T extends GlobalsTypeWithID = any>(args: UpdateGlobalArgs<T>) => Promise<T>


export type FindGlobalVersions = <T = TypeWithID>(args: FindGlobalVersionsArgs) => Promise<PaginatedDocs<TypeWithVersion<T>>>;

export type DeleteVersionsArgs = {
  collection: string
  where: Where
  locale?: string
  sort?: {
    [key: string]: string
  }
};

export type CreateVersionArgs<T = TypeWithID> = {
  collectionSlug: string
  /** ID of the parent document for which the version should be created for */
  parent: string | number
  versionData: T
  autosave: boolean
  createdAt: string
  updatedAt: string
}

export type CreateVersion = <T = TypeWithID>(args: CreateVersionArgs<T>) => Promise<TypeWithVersion<T>>;

export type DeleteVersions = (args: DeleteVersionsArgs) => Promise<void>;


export type UpdateVersionArgs<T = TypeWithID> = {
  collectionSlug: string,
  where: Where,
  locale?: string,
  versionData: T
}

export type UpdateVersion = <T = TypeWithID>(args: UpdateVersionArgs<T>) => Promise<TypeWithVersion<T>>


export type CreateArgs = {
  collection: string
  data: Record<string, unknown>
  draft?: boolean
  locale?: string
}

export type Create = (args: CreateArgs) => Promise<Document>

type UpdateArgs = {
  collection: string
  data: Record<string, unknown>
  where: Where
  draft?: boolean
  locale?: string
}

type Update = (args: UpdateArgs) => Promise<Document>

type UpdateOneArgs = {
  collection: string
  data: Record<string, unknown>
  where: Where
  draft?: boolean
  locale?: string
}

export type UpdateOne = (args: UpdateOneArgs) => Promise<Document>

type DeleteOneArgs = {
  collection: string
  data: Record<string, unknown>
  where: Where
}

type DeleteOne = (args: DeleteOneArgs) => Promise<Document>

type DeleteManyArgs = {
  collection: string
  where: Where
}

export type Migration = MigrationData & {
  up: ({ payload }: { payload }) => Promise<boolean>
  down: ({ payload }: { payload }) => Promise<boolean>
};

export type MigrationData = {
  id: string
  name: string
  batch: number
}

export type BuildSchema<TSchema> = (args: {
  config: SanitizedConfig,
  fields: Field[],
  options: BuildSchemaOptions,
}) => TSchema

export type BuildSchemaOptions = {
  options?: SchemaOptions
  allowIDField?: boolean
  disableUnique?: boolean
  draftsEnabled?: boolean
  indexSortableFields?: boolean
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

/**
 * Field config types that need representation in the database
 */
type FieldType = 'number'
  | 'text'
  | 'email'
  | 'textarea'
  | 'richText'
  | 'code'
  | 'json'
  | 'point'
  | 'radio'
  | 'checkbox'
  | 'date'
  | 'upload'
  | 'relationship'
  | 'row'
  | 'collapsible'
  | 'tabs'
  | 'array'
  | 'group'
  | 'select'
  | 'blocks'

export type FieldGeneratorFunction<TSchema, TField extends Field> = (args: FieldGenerator<TSchema, TField>) => void

/**
 * Object mapping types to a schema based on TSchema
 */
export type FieldToSchemaMap<TSchema> = {
  number: FieldGeneratorFunction<TSchema, NumberField>
  text: FieldGeneratorFunction<TSchema, TextField>
  email: FieldGeneratorFunction<TSchema, EmailField>
  textarea: FieldGeneratorFunction<TSchema, TextareaField>
  richText: FieldGeneratorFunction<TSchema, RichTextField>
  code: FieldGeneratorFunction<TSchema, CodeField>
  json: FieldGeneratorFunction<TSchema, JSONField>
  point: FieldGeneratorFunction<TSchema, PointField>
  radio: FieldGeneratorFunction<TSchema, RadioField>
  checkbox: FieldGeneratorFunction<TSchema, CheckboxField>
  date: FieldGeneratorFunction<TSchema, DateField>
  upload: FieldGeneratorFunction<TSchema, UploadField>
  relationship: FieldGeneratorFunction<TSchema, RelationshipField>
  row: FieldGeneratorFunction<TSchema, RowField>
  collapsible: FieldGeneratorFunction<TSchema, CollapsibleField>
  tabs: FieldGeneratorFunction<TSchema, TabsField>
  array: FieldGeneratorFunction<TSchema, ArrayField>
  group: FieldGeneratorFunction<TSchema, GroupField>
  select: FieldGeneratorFunction<TSchema, SelectField>
  blocks: FieldGeneratorFunction<TSchema, BlockField>
}

export type FieldGenerator<TSchema, TField> = {
  field: TField,
  schema: TSchema,
  config: SanitizedConfig,
  options: BuildSchemaOptions,
}
