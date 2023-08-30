import type { SQL } from 'drizzle-orm';
import type { Field } from 'payload/types';

import type { GenericColumn, PostgresAdapter } from '../types.js';

type BaseArgs = {
  adapter: PostgresAdapter
  data: Record<string, unknown>
  fallbackLocale?: false | string
  fields: Field[]
  locale: string
  path?: string
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
