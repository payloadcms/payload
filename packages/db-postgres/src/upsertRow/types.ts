import { Field } from 'payload/types';
import { SQL } from 'drizzle-orm';
import { GenericColumn, PostgresAdapter } from '../types';

type BaseArgs = {
  adapter: PostgresAdapter
  data: Record<string, unknown>
  fields: Field[]
  path?: string
  tableName: string
}

type CreateArgs = BaseArgs & {
  upsertTarget?: never
  where?: never
  id?: never
  operation: 'create'
}

type UpdateArgs = BaseArgs & {
  upsertTarget?: GenericColumn
  operation: 'update'
  where?: SQL<unknown>
  id?: string | number
}

export type Args = CreateArgs | UpdateArgs
