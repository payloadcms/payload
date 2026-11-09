import type { CreateVersionArgs, JsonObject, TypeWithVersion } from 'payload'

import { sql } from 'drizzle-orm'
import { buildVersionCollectionFields } from 'payload'
import { hasDraftsEnabled } from 'payload/shared'
import toSnakeCase from 'to-snake-case'

import type { DrizzleAdapter } from './types.js'

import { upsertRow } from './upsertRow/index.js'
import { getPrimaryDb } from './utilities/getPrimaryDb.js'
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

  const db = getPrimaryDb(this, await getTransaction(this, req))

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
    const versionUpdatedAt = result.updatedAt || updatedAt

    // Demote the versions that are older. When two versions have the same updatedAt, the one with the
    // higher id wins, so that writers who cannot see each other never leave two (or zero) latest versions.
    await this.execute({
      db,
      sql: sql`
        UPDATE ${table}
        SET latest = false
        WHERE ${table.id} != ${result.id}
          AND ${table.parent} = ${parent}
          AND (
            ${table.updatedAt} < ${versionUpdatedAt}
            OR (${table.updatedAt} = ${versionUpdatedAt} AND ${table.id} < ${result.id})
          )
      `,
    })

    // The new version loses the tie when a version with the same updatedAt and a higher id already exists.
    // Ids do not always increase (uuid), so the new version can be the lower one.
    await this.execute({
      db,
      sql: sql`
        UPDATE ${table}
        SET latest = false
        WHERE ${table.id} = ${result.id}
          AND EXISTS (
            SELECT 1 FROM ${table}
            WHERE ${table.parent} = ${parent}
              AND ${table.updatedAt} = ${versionUpdatedAt}
              AND ${table.id} > ${result.id}
          )
      `,
    })
  }

  if (returning === false) {
    return null
  }

  return result
}
