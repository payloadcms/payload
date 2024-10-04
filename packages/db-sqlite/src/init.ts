import type { DrizzleAdapter } from '@payloadcms/drizzle/types'
import type { Init, SanitizedCollectionConfig, SanitizedGlobalConfig } from 'payload'

import { createTableName, executeSchemaHooks } from '@payloadcms/drizzle'
import { uniqueIndex } from 'drizzle-orm/sqlite-core'
import { buildVersionCollectionFields, buildVersionGlobalFields } from 'payload'
import toSnakeCase from 'to-snake-case'

import type { BaseExtraConfig } from './schema/build.js'
import type { SQLiteAdapter } from './types.js'

import { buildTable } from './schema/build.js'

export const init: Init = async function init(this: SQLiteAdapter) {
  let locales: [string, ...string[]] | undefined
  await executeSchemaHooks({ type: 'beforeSchemaInit', adapter: this })

  if (this.payload.config.localization) {
    locales = this.payload.config.localization.locales.map(({ code }) => code) as [
      string,
      ...string[],
    ]
  }

  this.payload.config.collections.forEach((collection: SanitizedCollectionConfig) => {
    // Skip collections that have an .init() method
    if ('function' === typeof collection?.db?.init) {
      return
    }

    createTableName({
      adapter: this as unknown as DrizzleAdapter,
      config: collection,
    })

    if (collection.versions) {
      createTableName({
        adapter: this as unknown as DrizzleAdapter,
        config: collection,
        versions: true,
        versionsCustomName: true,
      })
    }
  })
  this.payload.config.collections.forEach((collection: SanitizedCollectionConfig) => {
    const tableName = this.tableNameMap.get(toSnakeCase(collection.slug))
    const config = this.payload.config

    const baseExtraConfig: BaseExtraConfig = {}

    if (collection.upload.filenameCompoundIndex) {
      const indexName = `${tableName}_filename_compound_idx`

      baseExtraConfig.filename_compound_index = (cols) => {
        const colsConstraint = collection.upload.filenameCompoundIndex.map((f) => {
          return cols[f]
        })
        return uniqueIndex(indexName).on(colsConstraint[0], ...colsConstraint.slice(1))
      }
    }

    if (collection.upload.filenameCompoundIndex) {
      const indexName = `${tableName}_filename_compound_idx`

      baseExtraConfig.filename_compound_index = (cols) => {
        const colsConstraint = collection.upload.filenameCompoundIndex.map((f) => {
          return cols[f]
        })
        return uniqueIndex(indexName).on(colsConstraint[0], ...colsConstraint.slice(1))
      }
    }

    buildTable({
      adapter: this,
      disableNotNull: !!collection?.versions?.drafts,
      disableUnique: false,
      fields: collection.fields,
      locales,
      tableName,
      timestamps: collection.timestamps,
      versions: false,
    })

    if (collection.versions) {
      const versionsTableName = this.tableNameMap.get(
        `_${toSnakeCase(collection.slug)}${this.versionsSuffix}`,
      )
      const versionFields = buildVersionCollectionFields(config, collection)

      buildTable({
        adapter: this,
        disableNotNull: !!collection.versions?.drafts,
        disableUnique: true,
        fields: versionFields,
        locales,
        tableName: versionsTableName,
        timestamps: true,
        versions: true,
      })
    }
  })

  this.payload.config.globals.forEach((global: SanitizedGlobalConfig) => {
    // Skip globals that have an .init() method
    if ('function' === typeof global?.db?.init) {
      return
    }

    const tableName = createTableName({
      adapter: this as unknown as DrizzleAdapter,
      config: global,
    })

    buildTable({
      adapter: this,
      disableNotNull: !!global?.versions?.drafts,
      disableUnique: false,
      fields: global.fields,
      locales,
      tableName,
      timestamps: false,
      versions: false,
    })

    if (global.versions) {
      const versionsTableName = createTableName({
        adapter: this as unknown as DrizzleAdapter,
        config: global,
        versions: true,
        versionsCustomName: true,
      })
      const config = this.payload.config
      const versionFields = buildVersionGlobalFields(config, global)

      buildTable({
        adapter: this,
        disableNotNull: !!global.versions?.drafts,
        disableUnique: true,
        fields: versionFields,
        locales,
        tableName: versionsTableName,
        timestamps: true,
        versions: true,
      })
    }
  })

  await executeSchemaHooks({ type: 'afterSchemaInit', adapter: this })
}
