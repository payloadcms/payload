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
import { maxIdentifierLength } from '../utilities/validateIdentifierLength.js'
import { buildTable } from './build.js'

type Args = {
  adapter: DrizzleAdapter
  setColumnID: SetColumnID
}

/**
 * Builds abstract Payload SQL schema
 */
export const buildRawSchema = ({ adapter, setColumnID }: Args) => {
  adapter.subTableNameReplacements = new Map()

  const seenTableNames = new Set<string>()

  // An array or `hasMany` select table can have the same name as a companion table of its parent
  // (an array field called `rels`, for example). Build again so those tables get a distinct name.
  // Renaming a table also renames its nested tables, which can clash in turn, so repeat until a
  // build finds no new clashes.
  for (let pass = 1; ; pass++) {
    adapter.rawTableKinds = new Map()
    adapter.sharedTableNames = new Set()
    adapter.subTableNameClashes = new Set()

    buildTables({ adapter, setColumnID })

    if (!adapter.subTableNameClashes.size) {
      return
    }

    if (pass >= MAX_BUILD_PASSES) {
      throw new Error(
        `Could not give distinct names to these tables: ${[...adapter.subTableNameClashes].join(', ')}. Set a custom dbName on the fields that create them.`,
      )
    }

    for (const [tableName, table] of Object.entries(adapter.rawTables)) {
      seenTableNames.add(tableName)

      // Postgres enums share the namespace with tables, so a table can't take an enum's name.
      for (const column of Object.values(table.columns)) {
        if (column.type === 'enum' && 'enumName' in column) {
          seenTableNames.add(column.enumName)
        }
      }
    }

    addSubTableNameReplacements({
      clashes: adapter.subTableNameClashes,
      replacements: adapter.subTableNameReplacements,
      seenTableNames,
    })

    adapter.rawRelations = {}
    adapter.rawTables = {}
  }
}

const MAX_BUILD_PASSES = 10

/**
 * Picks a replacement for each clashing sub-table name: `<name>_field`, or `<name>_field_2`,
 * `<name>_field_3`... when that is taken. A candidate is taken when a table or enum seen in any
 * build has that name or starts with it, since the renamed table's own nested tables are prefixed
 * with it. The name is cut short to keep the suffix within the identifier length limit.
 */
const addSubTableNameReplacements = ({
  clashes,
  replacements,
  seenTableNames,
}: {
  clashes: Set<string>
  replacements: Map<string, string>
  seenTableNames: Set<string>
}): Map<string, string> => {
  const isNameTaken = (candidate: string) =>
    [...seenTableNames].some((name) => name === candidate || name.startsWith(`${candidate}_`))

  const withSuffix = (name: string, suffix: string) =>
    `${name.slice(0, maxIdentifierLength - suffix.length)}${suffix}`

  for (const clash of [...clashes].sort()) {
    let candidate = withSuffix(clash, '_field')

    for (let index = 2; isNameTaken(candidate); index++) {
      candidate = withSuffix(clash, `_field_${index}`)
    }

    replacements.set(clash, candidate)
    seenTableNames.add(candidate)
  }

  return replacements
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
