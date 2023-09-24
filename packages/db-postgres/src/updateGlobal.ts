import type { UpdateGlobal } from 'payload/database'
import type { PayloadRequest } from 'payload/types'

import toSnakeCase from 'to-snake-case'

import type { PostgresAdapter } from './types'

import { upsertRow } from './upsertRow'

export const updateGlobal: UpdateGlobal = async function updateGlobal(
  this: PostgresAdapter,
  { data, req = {} as PayloadRequest, slug },
) {
  const db = this.sessions[req.transactionID] || this.db
  const globalConfig = this.payload.globals.config.find((config) => config.slug === slug)
  const tableName = toSnakeCase(slug)

  const existingGlobal = await this.db.query[tableName].findFirst({})

  const result = await upsertRow({
    ...(existingGlobal ? { id: existingGlobal.id, operation: 'update' } : { operation: 'create' }),
    adapter: this,
    data,
    db,
    fields: globalConfig.fields,
    tableName,
  })

  return result
}
