import type { SQL } from 'drizzle-orm'
import type { FlattenedField, JoinQuery, PayloadRequest, SelectType } from 'payload'

import type { DrizzleAdapter, DrizzleTransaction, GenericColumn } from '../types.js'

type BaseArgs = {
  adapter: DrizzleAdapter
  data: Record<string, unknown>
  db: DrizzleAdapter['drizzle'] | DrizzleTransaction
  fields: FlattenedField[]
  /**
   * When true, skips reading the data back from the database and returns the input data
   * @default false
   */
  ignoreResult?: boolean | 'idOnly'
  joinQuery?: JoinQuery
  path?: string
  req?: Partial<PayloadRequest>
  tableName: string
}

type CreateArgs = {
  id?: never
  joinQuery?: never
  operation: 'create'
  select?: SelectType
  upsertTarget?: never
  where?: never
} & BaseArgs

type UpdateArgs = {
  id?: number | string
  joinQuery?: JoinQuery
  operation: 'update'
  select?: SelectType
  upsertTarget?: GenericColumn
  where?: SQL<unknown>
} & BaseArgs

export type Args = CreateArgs | UpdateArgs
