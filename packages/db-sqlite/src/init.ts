import type { DrizzleAdapter } from '@payloadcms/drizzle/types'
import type { Init } from 'payload'

import { buildDrizzleRelations, buildRawSchema, executeSchemaHooks } from '@payloadcms/drizzle'

import type { SQLiteAdapter } from './types.js'

import { buildDrizzleTable } from './schema/buildDrizzleTable.js'
import { setColumnID } from './schema/setColumnID.js'

export const init: Init = async function init(this: SQLiteAdapter) {
  let locales: string[] | undefined

  this.rawRelations = {}
  this.rawTables = {}

  if (this.payload.config.localization) {
    locales = this.payload.config.localization.locales.map(({ code }) => code)
  }

  const adapter = this as unknown as DrizzleAdapter

  buildRawSchema({
    adapter,
    setColumnID,
  })

  await executeSchemaHooks({ type: 'beforeSchemaInit', adapter: this })

  for (const tableName in this.rawTables) {
    buildDrizzleTable({ adapter, locales: locales!, rawTable: this.rawTables[tableName]! })
  }

  buildDrizzleRelations({
    adapter,
  })

  await executeSchemaHooks({ type: 'afterSchemaInit', adapter: this })
}
