import type { CreateGlobalVersionArgs, TypeWithID, TypeWithVersion } from 'payload'

import { sql } from 'drizzle-orm'
import { buildVersionGlobalFields } from 'payload'

import type { DrizzleAdapter } from './types.js'

import { upsertRow } from './upsertRow/index.js'
import { getGlobal } from './utilities/getEntity.js'
import { getTransaction } from './utilities/getTransaction.js'

export async function createGlobalVersion<T extends TypeWithID>(
  this: DrizzleAdapter,
  {
    autosave,
    createdAt,
    globalSlug,
    publishedLocale,
    req,
    returning,
    select,
    snapshot,
    updatedAt,
    versionData,
  }: CreateGlobalVersionArgs,
) {
  const db = await getTransaction(this, req)
  const { globalConfig, tableName } = getGlobal({ adapter: this, globalSlug, versions: true })

  const result = await upsertRow<TypeWithVersion<T>>({
    adapter: this,
    data: {
      autosave,
      createdAt,
      latest: true,
      publishedLocale,
      snapshot,
      updatedAt,
      version: versionData,
    },
    db,
    fields: buildVersionGlobalFields(this.payload.config, globalConfig, true),
    ignoreResult: returning === false ? 'idOnly' : false,
    operation: 'create',
    req,
    select,
    tableName,
  })

  const table = this.tables[tableName]
  if (globalConfig.versions.drafts) {
    await this.execute({
      db,
      sql: sql`
          UPDATE ${table}
          SET latest = false
          WHERE ${table.id} != ${result.id};
        `,
    })
  }

  if (returning === false) {
    return null
  }

  return result
}
