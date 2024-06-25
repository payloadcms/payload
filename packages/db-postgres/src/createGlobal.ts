import type { CreateGlobalArgs, PayloadRequest, TypeWithID } from 'payload'

import toSnakeCase from 'to-snake-case'

import type { PostgresAdapter } from './types.js'

import { upsertRow } from './upsertRow/index.js'

export async function createGlobal<T extends TypeWithID>(
  this: PostgresAdapter,
  { slug, data, req = {} as PayloadRequest }: CreateGlobalArgs,
): Promise<T> {
  const db = this.sessions[req.transactionID]?.db || this.drizzle
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
