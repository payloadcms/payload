/* eslint-disable no-param-reassign */
import type { Init } from 'payload/database'
import type { SanitizedCollectionConfig } from 'payload/types'

import { pgEnum } from 'drizzle-orm/pg-core'
import { buildVersionCollectionFields, buildVersionGlobalFields } from 'payload/versions'

import type { PostgresAdapter } from './types'

import { buildTable } from './schema/build'
import { getConfigIDType } from './schema/getConfigIDType'
import { getTableName } from './utilities/getTableName'

export const init: Init = async function init(this: PostgresAdapter) {
  if (this.payload.config.localization) {
    this.enums.enum__locales = pgEnum(
      '_locales',
      this.payload.config.localization.locales.map(({ code }) => code) as [string, ...string[]],
    )
  }

  this.payload.config.collections.forEach((collection: SanitizedCollectionConfig) => {
    const tableName = getTableName(collection)

    buildTable({
      adapter: this,
      buildTexts: true,
      buildNumbers: true,
      buildRelationships: true,
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
        buildTexts: true,
        buildNumbers: true,
        buildRelationships: true,
        disableNotNull: !!collection.versions?.drafts,
        disableUnique: true,
        fields: versionFields,
        tableName: versionsTableName,
        timestamps: true,
      })
    }
  })

  this.payload.config.globals.forEach((global) => {
    const tableName = getTableName(global)

    buildTable({
      adapter: this,
      buildTexts: true,
      buildNumbers: true,
      buildRelationships: true,
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
        buildTexts: true,
        buildNumbers: true,
        buildRelationships: true,
        disableNotNull: !!global.versions?.drafts,
        disableUnique: true,
        fields: versionFields,
        tableName: versionsTableName,
        timestamps: true,
      })
    }
  })
}
