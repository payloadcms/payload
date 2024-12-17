import type { Init } from 'payload'

import type { BasePostgresAdapter } from './types.js'

import { buildDrizzleRelations } from '../schema/buildDrizzleRelations.js'
import { buildRawSchema } from '../schema/buildRawSchema.js'
import { executeSchemaHooks } from '../utilities/executeSchemaHooks.js'
import { buildDrizzleTable } from './schema/buildDrizzleTable.js'
import { setColumnID } from './schema/setColumnID.js'

export const init: Init = async function init(this: BasePostgresAdapter) {
  this.rawRelations = {}
  this.rawTables = {}

  buildRawSchema({
    adapter: this,
    setColumnID,
  })

  await executeSchemaHooks({ type: 'beforeSchemaInit', adapter: this })

  if (this.payload.config.localization) {
    this.enums.enum__locales = this.pgSchema.enum(
      '_locales',
      this.payload.config.localization.locales.map(({ code }) => code) as [string, ...string[]],
    )
  }

  for (const tableName in this.rawTables) {
    buildDrizzleTable({ adapter: this, rawTable: this.rawTables[tableName] })
  }

  buildDrizzleRelations({
    adapter: this,
  })

  await executeSchemaHooks({ type: 'afterSchemaInit', adapter: this })
}
