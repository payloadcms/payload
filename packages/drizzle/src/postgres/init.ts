import type { Init } from 'payload'

import { pgSchema } from 'drizzle-orm/pg-core'

import type { BasePostgresAdapter } from './types.js'

import { buildDrizzleRelations } from '../schema/buildDrizzleRelations.js'
import { buildRawSchema } from '../schema/buildRawSchema.js'
import { checkTruncatedIdentifiers } from '../utilities/checkTruncatedIdentifiers.js'
import { executeSchemaHooks } from '../utilities/executeSchemaHooks.js'
import { getSchemaNames } from '../utilities/getSchemaNames.js'
import { buildDrizzleTable } from './schema/buildDrizzleTable.js'
import { resolveSchema } from './schema/resolveSchema.js'
import { setColumnID } from './schema/setColumnID.js'

export const init: Init = async function init(this: BasePostgresAdapter) {
  this.rawRelations = {}
  this.rawTables = {}

  buildRawSchema({
    adapter: this,
    setColumnID,
  })

  await executeSchemaHooks({ type: 'beforeSchemaInit', adapter: this })

  // Warn on identifiers Postgres will truncate past 63 chars; throw only when two collide.
  checkTruncatedIdentifiers({ adapter: this, logWarnings: process.env.NODE_ENV !== 'production' })

  if (this.payload.config.localization) {
    this.enums.enum__locales = resolveSchema({
      name: '_locales',
      type: 'enum',
      adapter: this,
    }).enum(
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

  // Drizzle Kit only creates schemas that are exported next to the tables and enums
  const additionalSchemas: Record<string, unknown> = {}

  if (this.tableSchema) {
    for (const schemaName of getSchemaNames({ adapter: this }).slice(1)) {
      if (schemaName !== 'public') {
        additionalSchemas[`pgSchema_${schemaName}`] = pgSchema(schemaName)
      }
    }
  }

  this.schema = {
    pgSchema: this.pgSchema,
    ...additionalSchemas,
    ...this.tables,
    ...this.relations,
    ...this.enums,
  }
}
