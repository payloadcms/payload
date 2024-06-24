import type {
  CreateVersionArgs,
  PayloadRequestWithData,
  TypeWithID,
  TypeWithVersion,
} from 'payload'

import { sql } from 'drizzle-orm'
import { buildVersionCollectionFields } from 'payload'
import toSnakeCase from 'to-snake-case'

import type { PostgresAdapter } from './types.js'

import { upsertRow } from './upsertRow/index.js'

export async function createVersion<T extends TypeWithID>(
  this: PostgresAdapter,
  {
    autosave,
    collectionSlug,
    parent,
    req = {} as PayloadRequestWithData,
    versionData,
  }: CreateVersionArgs<T>,
) {
  const db = this.sessions[req.transactionID]?.db || this.drizzle
  const collection = this.payload.collections[collectionSlug].config
  const defaultTableName = toSnakeCase(collection.slug)

  const tableName = this.tableNameMap.get(`_${defaultTableName}${this.versionsSuffix}`)

  const version = { ...versionData }
  if (version.id) delete version.id

  const result = await upsertRow<TypeWithVersion<T>>({
    adapter: this,
    data: {
      autosave,
      latest: true,
      parent,
      version,
    },
    db,
    fields: buildVersionCollectionFields(collection),
    operation: 'create',
    req,
    tableName,
  })

  const table = this.tables[tableName]

  if (collection.versions.drafts) {
    await db.execute(sql`
      UPDATE ${table}
      SET latest = false
      WHERE ${table.id} != ${result.id}
        AND ${table.parent} = ${parent}
    `)
  }

  return result
}
