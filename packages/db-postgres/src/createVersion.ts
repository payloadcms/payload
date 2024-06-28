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
  const db = this.sessions[await req.transactionID]?.db || this.drizzle
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

  const relationshipsTable = this.tables[`${tableName}${this.relationshipsSuffix}`]

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
