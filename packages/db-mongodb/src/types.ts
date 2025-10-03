import type { ClientSession } from 'mongodb'
import type { IndexDefinition, IndexOptions, Model, PaginateModel, SchemaOptions } from 'mongoose'
import type {
  ArrayField,
  BlocksField,
  CheckboxField,
  CodeField,
  CollapsibleField,
  DateField,
  EmailField,
  Field,
  GroupField,
  JoinField,
  JSONField,
  NumberField,
  Payload,
  PayloadRequest,
  PointField,
  RadioField,
  RelationshipField,
  RichTextField,
  RowField,
  SanitizedConfig,
  SelectField,
  TabsField,
  TextareaField,
  TextField,
  UploadField,
} from 'payload'

import type { BuildQueryArgs } from './queries/getBuildQueryPlugin.js'

export interface CollectionModel extends Model<any>, PaginateModel<any> {
  /** buildQuery is used to transform payload's where operator into what can be used by mongoose (e.g. id => _id) */
  buildQuery: (args: BuildQueryArgs) => Promise<Record<string, unknown>> // TODO: Delete this
}

export interface AuthCollectionModel extends CollectionModel {
  resetPasswordExpiration: Date
  resetPasswordToken: string
}

export type TypeOfIndex = {
  fields: IndexDefinition
  options?: IndexOptions
}

export interface GlobalModel extends Model<Document> {
  buildQuery: (query: unknown, locale?: string) => Promise<Record<string, unknown>>
}

export type BuildSchema<TSchema> = (args: {
  config: SanitizedConfig
  fields: Field[]
  options: BuildSchemaOptions
}) => TSchema

export type BuildSchemaOptions = {
  allowIDField?: boolean
  disableUnique?: boolean
  draftsEnabled?: boolean
  indexSortableFields?: boolean
  options?: SchemaOptions
}

export type FieldGenerator<TSchema, TField> = {
  config: SanitizedConfig
  field: TField
  options: BuildSchemaOptions
  schema: TSchema
}

export type FieldGeneratorFunction<TSchema, TField extends Field> = (
  args: FieldGenerator<TSchema, TField>,
) => void

/**
 * Object mapping types to a schema based on TSchema
 */
export type FieldToSchemaMap<TSchema> = {
  array: FieldGeneratorFunction<TSchema, ArrayField>
  blocks: FieldGeneratorFunction<TSchema, BlocksField>
  checkbox: FieldGeneratorFunction<TSchema, CheckboxField>
  code: FieldGeneratorFunction<TSchema, CodeField>
  collapsible: FieldGeneratorFunction<TSchema, CollapsibleField>
  date: FieldGeneratorFunction<TSchema, DateField>
  email: FieldGeneratorFunction<TSchema, EmailField>
  group: FieldGeneratorFunction<TSchema, GroupField>
  join: FieldGeneratorFunction<TSchema, JoinField>
  json: FieldGeneratorFunction<TSchema, JSONField>
  number: FieldGeneratorFunction<TSchema, NumberField>
  point: FieldGeneratorFunction<TSchema, PointField>
  radio: FieldGeneratorFunction<TSchema, RadioField>
  relationship: FieldGeneratorFunction<TSchema, RelationshipField>
  richText: FieldGeneratorFunction<TSchema, RichTextField>
  row: FieldGeneratorFunction<TSchema, RowField>
  select: FieldGeneratorFunction<TSchema, SelectField>
  tabs: FieldGeneratorFunction<TSchema, TabsField>
  text: FieldGeneratorFunction<TSchema, TextField>
  textarea: FieldGeneratorFunction<TSchema, TextareaField>
  upload: FieldGeneratorFunction<TSchema, UploadField>
}

export type MigrateUpArgs = {
  /**
   * The Payload instance that you can use to execute Local API methods
   * To use the current transaction you must pass `req` to arguments
   * @example
   * ```ts
   *  import { type MigrateUpArgs } from '@payloadcms/db-mongodb'
   *
   * export async function up({ session, payload, req }: MigrateUpArgs): Promise<void> {
   *   const posts = await payload.find({ collection: 'posts', req })
   * }
   * ```
   */
  payload: Payload
  /**
   * The `PayloadRequest` object that contains the current transaction
   */
  req: PayloadRequest
  /**
   * The MongoDB client session that you can use to execute MongoDB methods directly within the current transaction.
   * @example
   * ```ts
   * import { type MigrateUpArgs } from '@payloadcms/db-mongodb'
   *
   * export async function up({ session, payload, req }: MigrateUpArgs): Promise<void> {
   *   const { rows: posts } = await payload.db.collections.posts.collection.find({ session }).toArray()
   * }
   * ```
   */
  session?: ClientSession
}
export type MigrateDownArgs = {
  /**
   * The Payload instance that you can use to execute Local API methods
   * To use the current transaction you must pass `req` to arguments
   * @example
   * ```ts
   * import { type MigrateDownArgs } from '@payloadcms/db-mongodb'
   *
   * export async function down({ session, payload, req }: MigrateDownArgs): Promise<void> {
   *   const posts = await payload.find({ collection: 'posts', req })
   * }
   * ```
   */
  payload: Payload
  /**
   * The `PayloadRequest` object that contains the current transaction
   */
  req: PayloadRequest
  /**
   * The MongoDB client session that you can use to execute MongoDB methods directly within the current transaction.
   * @example
   * ```ts
   * import { type MigrateDownArgs } from '@payloadcms/db-mongodb'
   *
   * export async function down({ session, payload, req }: MigrateDownArgs): Promise<void> {
   *   const { rows: posts } = await payload.db.collections.posts.collection.find({ session }).toArray()
   * }
   * ```
   */
  session?: ClientSession
}
