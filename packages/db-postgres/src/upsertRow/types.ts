import type { SQL } from 'drizzle-orm'
import type { Field, PayloadRequestWithData } from 'payload/types'

import type { DrizzleDB, GenericColumn, PostgresAdapter } from '../types.js'

type BaseArgs = {
  adapter: PostgresAdapter
  data: Record<string, unknown>
  db: DrizzleDB
  fields: Field[]
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
