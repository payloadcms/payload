import type { CreateGlobalVersionArgs, TypeWithID, TypeWithVersion } from 'payload'

import { sql } from 'drizzle-orm'
import { buildVersionGlobalFields } from 'payload'
import toSnakeCase from 'to-snake-case'

import type { DrizzleAdapter } from './types.js'

import { upsertRow } from './upsertRow/index.js'
import { getTransaction } from './utilities/getTransaction.js'

export async function createGlobalVersion<T extends TypeWithID>(
  this: DrizzleAdapter,
  {
    autosave,
    createdAt,
    globalSlug,
    publishedLocale,
    req,
    select,
    snapshot,
    updatedAt,
    versionData,
    returning,
  }: CreateGlobalVersionArgs,
) {
  const db = await getTransaction(this, req)
  const global = this.payload.globals.config.find(({ slug }) => slug === globalSlug)

  const tableName = this.tableNameMap.get(`_${toSnakeCase(global.slug)}${this.versionsSuffix}`)

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
    fields: buildVersionGlobalFields(this.payload.config, global, true),
    operation: 'create',
    req,
    select,
    tableName,
    ignoreResult: returning === false ? 'idOnly' : false,
  })

  const table = this.tables[tableName]
  if (global.versions.drafts) {
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
