import type { CreateVersionArgs, TypeWithID, TypeWithVersion } from 'payload'

import { sql } from 'drizzle-orm'
import { buildVersionCollectionFields } from 'payload'

import type { DrizzleAdapter } from './types.js'

import { upsertRow } from './upsertRow/index.js'
import { getCollection } from './utilities/getEntity.js'
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
    returning,
    select,
    snapshot,
    updatedAt,
    versionData,
  }: CreateVersionArgs<T>,
) {
  const db = await getTransaction(this, req)
  const { collectionConfig, tableName } = getCollection({
    adapter: this,
    collectionSlug,
    versions: true,
  })

  const version: Partial<TypeWithID> = { ...versionData }
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
    fields: buildVersionCollectionFields(this.payload.config, collectionConfig, true),
    operation: 'create',
    req,
    select,
    tableName,
  })

  const table = this.tables[tableName]

  if (collectionConfig.versions.drafts) {
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
