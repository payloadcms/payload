/* eslint-disable no-param-reassign */
import type { Init } from 'payload/database'
import type { SanitizedCollectionConfig } from 'payload/types'

import { pgEnum, pgSchema, pgTable } from 'drizzle-orm/pg-core'
import { buildVersionCollectionFields, buildVersionGlobalFields } from 'payload/versions'
import toSnakeCase from 'to-snake-case'

import type { PostgresAdapter } from './types'

import { buildTable } from './schema/build'
import { getConfigIDType } from './schema/getConfigIDType'

export const init: Init = async function init(this: PostgresAdapter) {
  if (this.schemaName) {
    this.pgSchema = pgSchema(this.schemaName)
  } else {
    this.pgSchema = { table: pgTable }
  }

  if (this.payload.config.localization) {
    this.enums.enum__locales = pgEnum(
      '_locales',
      this.payload.config.localization.locales.map(({ code }) => code) as [string, ...string[]],
    )
  }

  this.payload.config.collections.forEach((collection: SanitizedCollectionConfig) => {
    const tableName = toSnakeCase(collection.slug)

    buildTable({
      adapter: this,
      buildNumbers: true,
      buildRelationships: true,
      buildTexts: true,
      disableNotNull: !!collection?.versions?.drafts,
      disableUnique: false,
      fields: collection.fields,
      tableName,
      timestamps: collection.timestamps,
    })

    if (collection.versions) {
      const versionsTableName = `_${tableName}_v`
      const versionFields = buildVersionCollectionFields(collection)

      const versionsParentIDColType = getConfigIDType(collection.fields)

      buildTable({
        adapter: this,
        buildNumbers: true,
        buildRelationships: true,
        buildTexts: true,
        disableNotNull: !!collection.versions?.drafts,
        disableUnique: true,
        fields: versionFields,
        tableName: versionsTableName,
        timestamps: true,
      })
    }
  })

  this.payload.config.globals.forEach((global) => {
    const tableName = toSnakeCase(global.slug)

    buildTable({
      adapter: this,
      buildNumbers: true,
      buildRelationships: true,
      buildTexts: true,
      disableNotNull: !!global?.versions?.drafts,
      disableUnique: false,
      fields: global.fields,
      tableName,
      timestamps: false,
    })

    if (global.versions) {
      const versionsTableName = `_${tableName}_v`
      const versionFields = buildVersionGlobalFields(global)

      buildTable({
        adapter: this,
        buildNumbers: true,
        buildRelationships: true,
        buildTexts: true,
        disableNotNull: !!global.versions?.drafts,
        disableUnique: true,
        fields: versionFields,
        tableName: versionsTableName,
        timestamps: true,
      })
    }
  })
}
