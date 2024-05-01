/* eslint-disable no-param-reassign */
import type { Init } from 'payload/database'
import type { SanitizedCollectionConfig } from 'payload/types'

import { pgEnum, pgSchema, pgTable } from 'drizzle-orm/pg-core'
import { buildVersionCollectionFields, buildVersionGlobalFields } from 'payload/versions'

import type { PostgresAdapter } from './types'

import { buildTable } from './schema/build'
import { createTableName } from './schema/createTableName'

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
    const tableName = createTableName({
      adapter: this,
      config: collection,
    })

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
      versions: false,
    })

    if (collection.versions) {
      const versionsTableName = createTableName({
        adapter: this,
        config: collection,
        versions: true,
        versionsCustomName: true,
      })
      const versionFields = buildVersionCollectionFields(collection)

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
        versions: true,
      })
    }
  })

  this.payload.config.globals.forEach((global) => {
    const tableName = createTableName({ adapter: this, config: global })

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
      versions: false,
    })

    if (global.versions) {
      const versionsTableName = createTableName({
        adapter: this,
        config: global,
        versions: true,
        versionsCustomName: true,
      })
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
        versions: true,
      })
    }
  })
}
