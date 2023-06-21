import type { SchemaOptions } from 'mongoose';
import type { Configuration } from 'webpack';
import type { Config, SanitizedConfig } from '../config/types';
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
import type { Payload } from '../payload';
import type { Document, Where } from '../types';

export interface DatabaseAdapter {
  /**
   * reference to the instance of payload
   */
  payload: Payload;
  /**
   * Open the connection to the database
   */
  connect?: ({ config }: { config: SanitizedConfig }) => Promise<void>;

  /**
   * Perform startup tasks required to interact with the database such as building Schema and models
   */
  init?: ({ config }: { config: SanitizedConfig }) => Promise<void>;

  /**
   * Terminate the connection with the database
   */
  destroy?: () => Promise<void>;

  /**
   * Used to alias server only modules or make other changes to webpack configuration
   */
  webpack?: (config: Configuration) => Configuration;

  // migrations
  /**
   * Output a migration file
   */
  createMigration: () => Promise<void>;

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

  // versions
  queryDrafts: <T = TypeWithID>(args: QueryDraftsArgs) => Promise<PaginatedDocs<T>>;

  // operations
  find: <T = TypeWithID>(args: FindArgs) => Promise<PaginatedDocs<T>>;

  // TODO: ADD findGlobal method
  findVersions: <T = TypeWithID>(args: FindVersionArgs) => Promise<PaginatedDocs<T>>;
  findGlobalVersions: <T = TypeWithID>(args: FindGlobalVersionArgs) => Promise<PaginatedDocs<T>>;
  findOne: FindOne;
  create: Create;
  update: Update;
  updateOne: UpdateOne;
  deleteOne: DeleteOne;
  deleteMany: DeleteMany;
}

export type QueryDraftsArgs = {
  collection: string
  where?: Where
  page?: number
  limit?: number
  pagination?: boolean
  sortProperty?: string
  sortOrder?: string
  locale?: string
}

export type FindArgs = {
  collection: string
  where?: Where
  page?: number
  skip?: number
  versions?: boolean
  limit?: number
  pagination?: boolean
  sortProperty?: string
  sortOrder?: string
  locale?: string
}

export type FindVersionArgs = {
  collection: string
  where?: Where
  page?: number
  skip?: number
  versions?: boolean
  limit?: number
  pagination?: boolean
  sortProperty?: string
  sortOrder?: string
  locale?: string
}

export type FindGlobalVersionArgs = {
  global: string
  where?: Where
  page?: number
  skip?: number
  versions?: boolean
  limit?: number
  pagination?: boolean
  sortProperty?: string
  sortOrder?: string
  locale?: string
}

export type FindOneArgs = {
  collection: string
  where: Where
  locale?: string
  sort?: {
    [key: string]: string,
  }
}

type FindOne = (args: FindOneArgs) => Promise<PaginatedDocs>

type CreateArgs = {
  collection: string
  data: Record<string, unknown>
  draft?: boolean
  locale?: string
}

type Create = (args: CreateArgs) => Promise<Document>

type UpdateArgs = {
  collection: string
  data: Record<string, unknown>
  where: Where
  draft?: boolean
  locale?: string
}

type Update = (args: UpdateArgs) => Promise<Document>

type UpdateOneArgs = {
  collection: string,
  data: Record<string, unknown>,
  where: Where,
  draft?: boolean
  locale?: string
}

type UpdateOne = (args: UpdateOneArgs) => Promise<Document>

type DeleteOneArgs = {
  collection: string,
  data: Record<string, unknown>,
  where: Where,
}

type DeleteOne = (args: DeleteOneArgs) => Promise<Document>

type DeleteManyArgs = {
  collection: string,
  where: Where,
}

type DeleteMany = (args: DeleteManyArgs) => Promise<Document>

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

export type BuildSortParam = (args: {
  sort: string
  config: Config
  fields: Field[]
  timestamps: boolean
  locale: string
}) => {
  sortProperty: string
  sortOrder: string
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
