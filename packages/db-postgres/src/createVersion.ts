import type { CreateVersion } from 'payload/database'
import type { PayloadRequest } from 'payload/dist/express/types'

import { sql } from 'drizzle-orm'
import { buildVersionCollectionFields } from 'payload/versions'
import toSnakeCase from 'to-snake-case'

import type { PostgresAdapter } from './types'

import { upsertRow } from './upsertRow'

export const createVersion: CreateVersion = async function createVersion(
  this: PostgresAdapter,
  { autosave, collectionSlug, parent, req = {} as PayloadRequest, versionData },
) {
  const db = this.sessions?.[req.transactionID] || this.db
  const collection = this.payload.collections[collectionSlug].config
  const collectionTableName = toSnakeCase(collectionSlug)
  const tableName = `_${collectionTableName}_v`

  const result = await upsertRow({
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
