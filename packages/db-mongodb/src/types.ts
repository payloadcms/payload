import type {
  AggregatePaginateModel,
  IndexDefinition,
  IndexOptions,
  Model,
  PaginateModel,
  SchemaOptions,
} from 'mongoose'
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

import type { BuildQueryArgs } from './queries/buildQuery.js'

export interface CollectionModel
  extends Model<any>,
    PaginateModel<any>,
    AggregatePaginateModel<any> {
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

export type MigrateUpArgs = { payload: Payload; req: PayloadRequest }
export type MigrateDownArgs = { payload: Payload; req: PayloadRequest }
