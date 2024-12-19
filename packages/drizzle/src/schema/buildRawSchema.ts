import { buildVersionCollectionFields, buildVersionGlobalFields } from 'payload'
import toSnakeCase from 'to-snake-case'

import type { DrizzleAdapter, RawIndex, SetColumnID } from '../types.js'

import { createTableName } from '../createTableName.js'
import { buildTable } from './build.js'

/**
 * Builds abstract Payload SQL schema
 */
export const buildRawSchema = ({
  adapter,
  setColumnID,
}: {
  adapter: DrizzleAdapter
  setColumnID: SetColumnID
}) => {
  adapter.payload.config.collections.forEach((collection) => {
    createTableName({
      adapter,
      config: collection,
    })

    if (collection.versions) {
      createTableName({
        adapter,
        config: collection,
        versions: true,
        versionsCustomName: true,
      })
    }
  })

  adapter.payload.config.collections.forEach((collection) => {
    const tableName = adapter.tableNameMap.get(toSnakeCase(collection.slug))
    const config = adapter.payload.config

    const baseIndexes: Record<string, RawIndex> = {}

    if (collection.upload.filenameCompoundIndex) {
      const indexName = `${tableName}_filename_compound_idx`

      baseIndexes.filename_compound_index = {
        name: indexName,
        on: collection.upload.filenameCompoundIndex.map((f) => f),
        unique: true,
      }
    }

    buildTable({
      adapter,
      disableNotNull: !!collection?.versions?.drafts,
      disableUnique: false,
      fields: collection.flattenedFields,
      setColumnID,
      tableName,
      timestamps: collection.timestamps,
      versions: false,
    })

    if (collection.versions) {
      const versionsTableName = adapter.tableNameMap.get(
        `_${toSnakeCase(collection.slug)}${adapter.versionsSuffix}`,
      )
      const versionFields = buildVersionCollectionFields(config, collection, true)

      buildTable({
        adapter,
        disableNotNull: !!collection.versions?.drafts,
        disableUnique: true,
        fields: versionFields,
        setColumnID,
        tableName: versionsTableName,
        timestamps: true,
        versions: true,
      })
    }
  })

  adapter.payload.config.globals.forEach((global) => {
    const tableName = createTableName({
      adapter,
      config: global,
    })

    buildTable({
      adapter,
      disableNotNull: !!global?.versions?.drafts,
      disableUnique: false,
      fields: global.flattenedFields,
      setColumnID,
      tableName,
      timestamps: false,
      versions: false,
    })

    if (global.versions) {
      const versionsTableName = createTableName({
        adapter,
        config: global,
        versions: true,
        versionsCustomName: true,
      })
      const config = adapter.payload.config
      const versionFields = buildVersionGlobalFields(config, global, true)

      buildTable({
        adapter,
        disableNotNull: !!global.versions?.drafts,
        disableUnique: true,
        fields: versionFields,
        setColumnID,
        tableName: versionsTableName,
        timestamps: true,
        versions: true,
      })
    }
  })
}
