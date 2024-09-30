import type { CreateGlobalArgs, PayloadRequest } from 'payload'

import toSnakeCase from 'to-snake-case'

import type { DrizzleAdapter } from './types.js'

import { upsertRow } from './upsertRow/index.js'

export async function createGlobal<T extends Record<string, unknown>>(
  this: DrizzleAdapter,
  { slug, data, req = {} as PayloadRequest }: CreateGlobalArgs,
): Promise<T> {
  const db = this.sessions[await req?.transactionID]?.db || this.drizzle
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
