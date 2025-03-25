import type { CreateVersionArgs, TypeWithID, TypeWithVersion } from 'payload'

import { sql } from 'drizzle-orm'
import { buildVersionCollectionFields } from 'payload'
import toSnakeCase from 'to-snake-case'

import type { DrizzleAdapter } from './types.js'

import { upsertRow } from './upsertRow/index.js'
import { getTransaction } from './utilities/getTransaction.js'

export async function createVersion<T extends TypeWithID>(
  this: DrizzleAdapter,
  {
    autosave,
    collectionSlug,
    createdAt,
    parent,
    publishedLocale,
    req,
    select,
    snapshot,
    updatedAt,
    versionData,
    returning,
  }: CreateVersionArgs<T>,
) {
  const db = await getTransaction(this, req)
  const collection = this.payload.collections[collectionSlug].config
  const defaultTableName = toSnakeCase(collection.slug)

  const tableName = this.tableNameMap.get(`_${defaultTableName}${this.versionsSuffix}`)

  const version = { ...versionData }
  if (version.id) {
    delete version.id
  }

  const data: Record<string, unknown> = {
    autosave,
    createdAt,
    latest: true,
    parent,
    publishedLocale,
    snapshot,
    updatedAt,
    version,
  }

  const result = await upsertRow<TypeWithVersion<T>>({
    adapter: this,
    data,
    db,
    fields: buildVersionCollectionFields(this.payload.config, collection, true),
    operation: 'create',
    req,
    select,
    tableName,
  })

  const table = this.tables[tableName]

  if (collection.versions.drafts) {
    await this.execute({
      db,
      sql: sql`
        UPDATE ${table}
        SET latest = false
        WHERE ${table.id} != ${result.id}
          AND ${table.parent} = ${parent}
          AND ${table.updatedAt} < ${result.updatedAt}
      `,
    })
  }

  if (returning === false) {
    return null
  }

  return result
}
