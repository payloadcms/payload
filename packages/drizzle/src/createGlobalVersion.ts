import type { CreateGlobalVersionArgs, PayloadRequest, TypeWithID, TypeWithVersion } from 'payload'

import { sql } from 'drizzle-orm'
import { buildVersionGlobalFields } from 'payload'
import toSnakeCase from 'to-snake-case'

import type { DrizzleAdapter } from './types.js'

import { upsertRow } from './upsertRow/index.js'

export async function createGlobalVersion<T extends TypeWithID>(
  this: DrizzleAdapter,
  { autosave, globalSlug, req = {} as PayloadRequest, versionData }: CreateGlobalVersionArgs,
) {
  const db = this.sessions[await req.transactionID]?.db || this.drizzle
  const global = this.payload.globals.config.find(({ slug }) => slug === globalSlug)

  const tableName = this.tableNameMap.get(`_${toSnakeCase(global.slug)}${this.versionsSuffix}`)

  const result = await upsertRow<TypeWithVersion<T>>({
    adapter: this,
    data: {
      autosave,
      latest: true,
      version: versionData,
    },
    db,
    fields: buildVersionGlobalFields(global),
    operation: 'create',
    req,
    tableName,
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

  return result
}
