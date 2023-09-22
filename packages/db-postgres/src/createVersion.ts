import type { CreateVersion } from 'payload/database'
import type { PayloadRequest } from 'payload/dist/express/types'

import { and, eq, ne } from 'drizzle-orm'
import { buildVersionCollectionFields } from 'payload/versions'
import toSnakeCase from 'to-snake-case'

import type { PostgresAdapter } from './types'

import { upsertRow } from './upsertRow'

export const createVersion: CreateVersion = async function createVersion (
  this: PostgresAdapter,
  { autosave, collectionSlug, parent, req = {} as PayloadRequest, versionData },
) {
  const db = this.sessions?.[req.transactionID] || this.db
  const collection = this.payload.collections[collectionSlug].config
  const tableName = toSnakeCase(collectionSlug)
  const versionTableName = `_${tableName}_versions`;

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
    tableName: versionTableName,
  })

  await db.update(this.tables[versionTableName])
    .set({latest: false})
    .where(and(
      eq(this.tables[versionTableName].latest, true),
      ne(this.tables[versionTableName].id, result.id),
    ));

  return result
}
