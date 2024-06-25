import type { CreateGlobalArgs } from 'payload/database'
import type { PayloadRequest, TypeWithID } from 'payload/types'

import toSnakeCase from 'to-snake-case'

import type { PostgresAdapter } from './types'

import { upsertRow } from './upsertRow'

export async function createGlobal<T extends TypeWithID>(
  this: PostgresAdapter,
  { slug, data, req = {} as PayloadRequest }: CreateGlobalArgs,
): Promise<T> {
  const db = this.sessions[await req.transactionID]?.db || this.drizzle
  const globalConfig = this.payload.globals.config.find((config) => config.slug === slug)

  const tableName = this.tableNameMap.get(toSnakeCase(globalConfig.slug))

  const result = await upsertRow<T>({
    adapter: this,
    data,
    db,
    fields: globalConfig.fields,
    operation: 'create',
    req,
    tableName,
  })

  return result
}
