import type {
  AggregatePaginateModel,
  IndexDefinition,
  IndexOptions,
  Model,
  PaginateModel,
  SchemaOptions,
} from 'mongoose'
import type { Payload } from 'payload'
import type { SanitizedConfig } from 'payload/config'
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
  TextField,
  TextareaField,
  UploadField,
} from 'payload/types'

import type { BuildQueryArgs } from './queries/buildQuery'

export interface CollectionModel
  extends Model<any>,
    PaginateModel<any>,
    AggregatePaginateModel<any>,
    PassportLocalModel {
  /** buildQuery is used to transform payload's where operator into what can be used by mongoose (e.g. id => _id) */
  buildQuery: (args: BuildQueryArgs) => Promise<Record<string, unknown>> // TODO: Delete this
}
type Register<T = any> = (doc: T, password: string) => T

interface PassportLocalModel {
  authenticate: any
  register: Register
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

/**
 * Field config types that need representation in the database
 */
type FieldType =
  | 'array'
  | 'blocks'
  | 'checkbox'
  | 'code'
  | 'collapsible'
  | 'date'
  | 'email'
  | 'group'
  | 'json'
  | 'number'
  | 'point'
  | 'radio'
  | 'relationship'
  | 'richText'
  | 'row'
  | 'select'
  | 'tabs'
  | 'text'
  | 'textarea'
  | 'upload'

export type FieldGeneratorFunction<TSchema, TField extends Field> = (
  args: FieldGenerator<TSchema, TField>,
) => void

/**
 * Object mapping types to a schema based on TSchema
 */
export type FieldToSchemaMap<TSchema> = {
  array: FieldGeneratorFunction<TSchema, ArrayField>
  blocks: FieldGeneratorFunction<TSchema, BlockField>
  checkbox: FieldGeneratorFunction<TSchema, CheckboxField>
  code: FieldGeneratorFunction<TSchema, CodeField>
  collapsible: FieldGeneratorFunction<TSchema, CollapsibleField>
  date: FieldGeneratorFunction<TSchema, DateField>
  email: FieldGeneratorFunction<TSchema, EmailField>
  group: FieldGeneratorFunction<TSchema, GroupField>
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

export type MigrateUpArgs = { payload: Payload }
export type MigrateDownArgs = { payload: Payload }
