import type { CreateGlobalVersion } from 'payload/database'
import type { PayloadRequest } from 'payload/types'

import { sql } from 'drizzle-orm'
import { buildVersionGlobalFields } from 'payload/versions'
import toSnakeCase from 'to-snake-case'

import type { PostgresAdapter } from './types'

import { upsertRow } from './upsertRow'

export const createGlobalVersion: CreateGlobalVersion = async function createGlobalVersion(
  this: PostgresAdapter,
  { autosave, globalSlug, req = {} as PayloadRequest, versionData },
) {
  const db = this.sessions?.[req.transactionID] || this.db
  const global = this.payload.globals.config.find(({ slug }) => slug === globalSlug)
  const globalTableName = toSnakeCase(globalSlug)
  const tableName = `_${globalTableName}_versions`

  const result = await upsertRow({
    adapter: this,
    data: {
      autosave,
      latest: true,
      version: versionData,
    },
    db,
    fields: buildVersionGlobalFields(global),
    operation: 'create',
    tableName,
  })

  const table = this.tables[tableName]

  if (global.versions.drafts) {
    await db.execute(sql`
      UPDATE ${table}
      SET latest = false
      WHERE ${table.id} != ${result.id};
  `)
  }

  return result
}
