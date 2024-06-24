import type { SQL } from 'drizzle-orm'
import type { Field, PayloadRequestWithData } from 'payload'

import type { DrizzleDB, GenericColumn, PostgresAdapter } from '../types.js'

type BaseArgs = {
  adapter: PostgresAdapter
  data: Record<string, unknown>
  db: DrizzleDB
  fields: Field[]
  /**
   * When true, skips reading the data back from the database and returns the input data
   * @default false
   */
  ignoreResult?: boolean
  path?: string
  req: PayloadRequestWithData
  tableName: string
}

type CreateArgs = BaseArgs & {
  id?: never
  operation: 'create'
  upsertTarget?: never
  where?: never
}

type UpdateArgs = BaseArgs & {
  id?: number | string
  operation: 'update'
  upsertTarget?: GenericColumn
  where?: SQL<unknown>
}

export type Args = CreateArgs | UpdateArgs
