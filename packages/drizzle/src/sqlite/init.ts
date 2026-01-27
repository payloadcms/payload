import type { Init } from 'payload'

import type { DrizzleAdapter } from '../types.js'
import type { BaseSQLiteAdapter } from './types.js'

import { buildDrizzleRelations } from '../schema/buildDrizzleRelations.js'
import { buildRawSchema } from '../schema/buildRawSchema.js'
import { executeSchemaHooks } from '../utilities/executeSchemaHooks.js'
import { buildDrizzleTable } from './schema/buildDrizzleTable.js'
import { setColumnID } from './schema/setColumnID.js'

export const init: Init = async function init(this: BaseSQLiteAdapter) {
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
    buildDrizzleTable({ adapter, locales, rawTable: this.rawTables[tableName] })
  }

  buildDrizzleRelations({
    adapter,
  })

  await executeSchemaHooks({ type: 'afterSchemaInit', adapter: this })

  this.schema = {
    ...this.tables,
    ...this.relations,
  }
}
