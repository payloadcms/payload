import {
  buildVersionCollectionFields,
  buildVersionCompoundIndexes,
  buildVersionGlobalFields,
} from 'payload'
import { hasDraftsEnabled } from 'payload/shared'
import toSnakeCase from 'to-snake-case'

import type { DrizzleAdapter, RawIndex, SetColumnID } from '../types.js'

import { createTableName } from '../createTableName.js'
import { buildIndexName } from '../utilities/buildIndexName.js'
import { buildTable } from './build.js'

type Args = {
  adapter: DrizzleAdapter
  setColumnID: SetColumnID
}

/**
 * Builds abstract Payload SQL schema
 */
export const buildRawSchema = ({ adapter, setColumnID }: Args) => {
  adapter.subTableNameClashes = new Set()

  buildTables({ adapter, setColumnID })

  // An array or `hasMany` select table had the same name as a companion table of its parent (an
  // array field called `rels`, for example). Build again so those tables get a distinct name.
  if (adapter.subTableNameClashes.size) {
    adapter.rawRelations = {}
    adapter.rawTables = {}

    buildTables({ adapter, setColumnID })
  }
}

const buildTables = ({ adapter, setColumnID }: Args) => {
  adapter.indexes = new Set()
  adapter.foreignKeys = new Set()

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
      const indexName = buildIndexName({ name: `${tableName}_filename_compound`, adapter })

      baseIndexes.filename_compound_index = {
        name: indexName,
        on: collection.upload.filenameCompoundIndex.map((f) => f),
        unique: true,
      }
    }

    buildTable({
      adapter,
      baseIndexes,
      blocksTableNameMap: {},
      compoundIndexes: collection.sanitizedIndexes,
      disableNotNull: !!collection?.versions?.drafts,
      disableUnique: false,
      fields: collection.flattenedFields,
      parentIsLocalized: false,
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
        blocksTableNameMap: {},
        compoundIndexes: buildVersionCompoundIndexes({ indexes: collection.sanitizedIndexes }),
        disableNotNull: !!collection.versions?.drafts,
        disableUnique: true,
        fields: versionFields,
        parentIsLocalized: false,
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
      blocksTableNameMap: {},
      disableNotNull: hasDraftsEnabled(global),
      disableUnique: false,
      fields: global.flattenedFields,
      parentIsLocalized: false,
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
        blocksTableNameMap: {},
        disableNotNull: !!global.versions?.drafts,
        disableUnique: true,
        fields: versionFields,
        parentIsLocalized: false,
        setColumnID,
        tableName: versionsTableName,
        timestamps: true,
        versions: true,
      })
    }
  })
}
