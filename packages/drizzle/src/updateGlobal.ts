import type { PayloadRequest, UpdateGlobalArgs } from 'payload'

import toSnakeCase from 'to-snake-case'

import type { DrizzleAdapter } from './types.js'

import { upsertRow } from './upsertRow/index.js'

export async function updateGlobal<T extends Record<string, unknown>>(
  this: DrizzleAdapter,
  { slug, data, req = {} as PayloadRequest, select }: UpdateGlobalArgs,
): Promise<T> {
  const db = this.sessions[await req?.transactionID]?.db || this.drizzle
  const globalConfig = this.payload.globals.config.find((config) => config.slug === slug)
  const tableName = this.tableNameMap.get(toSnakeCase(globalConfig.slug))

  const existingGlobal = await db.query[tableName].findFirst({})

  const result = await upsertRow<T>({
    ...(existingGlobal ? { id: existingGlobal.id, operation: 'update' } : { operation: 'create' }),
    adapter: this,
    data,
    db,
    fields: globalConfig.fields,
    req,
    select,
    tableName,
  })

  return result
}
