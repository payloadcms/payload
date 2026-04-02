import type { CreateVersionArgs, JsonObject, TypeWithVersion } from 'payload'

import { sql } from 'drizzle-orm'
import { buildVersionCollectionFields } from 'payload'
import { hasDraftsEnabled } from 'payload/shared'
import toSnakeCase from 'to-snake-case'

import type { DrizzleAdapter } from './types.js'

import { upsertRow } from './upsertRow/index.js'
import { getTransaction } from './utilities/getTransaction.js'

export async function createVersion<T extends JsonObject = JsonObject>(
  this: DrizzleAdapter,
  {
    autosave,
    collectionSlug,
    createdAt,
    parent,
    publishedLocale,
    req,
    returning,
    select,
    snapshot,
    updatedAt,
    versionData,
  }: CreateVersionArgs<T>,
): Promise<TypeWithVersion<T>> {
  const collection = this.payload.collections[collectionSlug].config
  if (collection.versions.drafts) {
    if (typeof select === 'object') {
      select.updatedAt = true
    }
  }

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

  const db = await getTransaction(this, req)

  const result = await upsertRow<TypeWithVersion<T>>({
    adapter: this,
    collectionSlug,
    data,
    db,
    fields: buildVersionCollectionFields(this.payload.config, collection, true),
    ignoreResult: returning === false ? 'idOnly' : undefined,
    operation: 'create',
    req,
    select,
    tableName,
  })

  const table = this.tables[tableName]

  if (hasDraftsEnabled(collection)) {
    await this.execute({
      db,
      sql: sql`
        UPDATE ${table}
        SET latest = false
        WHERE ${table.id} != ${result.id}
          AND ${table.parent} = ${parent}
          AND ${table.updatedAt} < ${result.updatedAt || updatedAt}
      `,
    })
  }

  if (returning === false) {
    return null
  }

  return result
}
