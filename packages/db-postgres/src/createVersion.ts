import type { CreateVersionArgs, TypeWithVersion } from 'payload/database'
import type { PayloadRequest, TypeWithID } from 'payload/types'

import { sql } from 'drizzle-orm'
import { buildVersionCollectionFields } from 'payload/versions'
import toSnakeCase from 'to-snake-case'

import type { PostgresAdapter } from './types'

import { upsertRow } from './upsertRow'

export async function createVersion<T extends TypeWithID>(
  this: PostgresAdapter,
  {
    autosave,
    collectionSlug,
    parent,
    req = {} as PayloadRequest,
    versionData,
  }: CreateVersionArgs<T>,
) {
  const db = this.sessions?.[req.transactionID] || this.db
  const collection = this.payload.collections[collectionSlug].config
  const collectionTableName = toSnakeCase(collectionSlug)
  const tableName = `_${collectionTableName}_v`

  const result = await upsertRow<TypeWithVersion<T>>({
    adapter: this,
    data: {
      autosave,
      latest: true,
      parent,
      version: versionData,
    },
    db,
    fields: buildVersionCollectionFields(collection),
    operation: 'create',
    tableName,
  })

  const table = this.tables[tableName]
  const relationshipsTable = this.tables[`${tableName}_relationships`]

  if (collection.versions.drafts) {
    await db.execute(sql`
      UPDATE ${table}
      SET latest = false
      FROM ${relationshipsTable}
      WHERE ${table.id} = ${relationshipsTable.parent}
        AND ${relationshipsTable.path} = ${'parent'}
        AND ${relationshipsTable[`${collectionSlug}ID`]} = ${parent}
        AND ${table.id} != ${result.id};
  `)
  }

  return result
}
