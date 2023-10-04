/* eslint-disable no-param-reassign */
import type { Init } from 'payload/database'
import type { SanitizedCollectionConfig } from 'payload/types'

import { pgEnum } from 'drizzle-orm/pg-core'
import { buildVersionCollectionFields, buildVersionGlobalFields } from 'payload/versions'
import toSnakeCase from 'to-snake-case'

import type { PostgresAdapter } from './types'

import { buildTable } from './schema/build'

export const init: Init = async function init(this: PostgresAdapter) {
  if (this.payload.config.localization) {
    this.enums.enum__locales = pgEnum(
      '_locales',
      // TODO: types out of sync with core, monorepo please
      // this.payload.config.localization.localeCodes,
      (this.payload.config.localization.locales as unknown as { code: string }[]).map(
        ({ code }) => code,
      ) as [string, ...string[]],
    )
  }

  this.payload.config.collections.forEach((collection: SanitizedCollectionConfig) => {
    const tableName = toSnakeCase(collection.slug)

    buildTable({
      adapter: this,
      buildRelationships: true,
      fields: collection.fields,
      tableName,
      timestamps: collection.timestamps,
    })

    if (collection.versions) {
      const versionsTableName = `_${tableName}_versions`
      const versionFields = buildVersionCollectionFields(collection)

      buildTable({
        adapter: this,
        buildRelationships: true,
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
      buildRelationships: true,
      fields: global.fields,
      tableName,
      timestamps: false,
    })

    if (global.versions) {
      const versionsTableName = `_${tableName}_versions`
      const versionFields = buildVersionGlobalFields(global)

      buildTable({
        adapter: this,
        buildRelationships: true,
        fields: versionFields,
        tableName: versionsTableName,
        timestamps: true,
      })
    }
  })
}
