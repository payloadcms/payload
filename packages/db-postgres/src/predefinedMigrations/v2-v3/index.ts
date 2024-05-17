import type { Payload } from 'payload'

import { sql } from 'drizzle-orm'
import { buildVersionCollectionFields, buildVersionGlobalFields } from 'payload/versions'
import toSnakeCase from 'to-snake-case'

import type { PostgresAdapter } from '../../types.js'
import type { ColumnToCreate, WhereConditionMap } from './types.js'

import { createColumns } from './createColumns.js'
import { migrateRelationships } from './migrateRelationships.js'
import { traverseFields } from './traverseFields.js'

type Args = {
  debug?: boolean
  dryRun?: boolean
  payload: Payload
}

export const migratePostgresV2toV3 = async ({ debug, dryRun, payload }: Args) => {
  const db = payload.db as PostgresAdapter

  for (const collection of payload.config.collections) {
    const tableName = db.tableNameMap.get(toSnakeCase(collection.slug))

    const columnsToCreate: ColumnToCreate[] = []
    const whereConditionMap: WhereConditionMap = new Map()

    traverseFields({
      collectionSlug: collection.slug,
      columnPrefix: '',
      columnsToCreate,
      db,
      disableNotNull: false,
      fields: collection.fields,
      isVersions: false,
      newTableName: tableName,
      parentTableName: tableName,
      path: '',
      payload,
      rootTableName: tableName,
      whereConditionMap,
    })

    await createColumns({
      columnsToCreate,
      db,
      debug,
      dryRun,
      payload,
    })

    await migrateRelationships({
      collectionSlug: collection.slug,
      db,
      debug,
      dryRun,
      fields: collection.fields,
      isVersions: false,
      payload,
      whereConditionMap,
    })

    if (collection.versions) {
      const versionsTableName = db.tableNameMap.get(
        `_${toSnakeCase(collection.slug)}${db.versionsSuffix}`,
      )
      const versionFields = buildVersionCollectionFields(collection)

      const versionColumnsToCreate: ColumnToCreate[] = []
      const versionWhereConditionMap: WhereConditionMap = new Map()

      traverseFields({
        collectionSlug: collection.slug,
        columnPrefix: '',
        columnsToCreate: versionColumnsToCreate,
        db,
        disableNotNull: true,
        fields: versionFields,
        isVersions: true,
        newTableName: versionsTableName,
        parentTableName: versionsTableName,
        path: '',
        payload,
        rootTableName: versionsTableName,
        whereConditionMap: versionWhereConditionMap,
      })

      await createColumns({
        columnsToCreate: versionColumnsToCreate,
        db,
        debug,
        dryRun,
        payload,
      })

      await migrateRelationships({
        collectionSlug: collection.slug,
        db,
        debug,
        dryRun,
        fields: versionFields,
        isVersions: true,
        payload,
        whereConditionMap,
      })
    }
  }

  for (const global of payload.config.globals) {
    const tableName = db.tableNameMap.get(toSnakeCase(global.slug))

    const columnsToCreate: ColumnToCreate[] = []
    const whereConditionMap: WhereConditionMap = new Map()

    traverseFields({
      columnPrefix: '',
      columnsToCreate,
      db,
      disableNotNull: false,
      fields: global.fields,
      globalSlug: global.slug,
      isVersions: false,
      newTableName: tableName,
      parentTableName: tableName,
      path: '',
      payload,
      rootTableName: tableName,
      whereConditionMap,
    })

    await createColumns({
      columnsToCreate,
      db,
      debug,
      dryRun,
      payload,
    })

    await migrateRelationships({
      db,
      debug,
      dryRun,
      fields: global.fields,
      globalSlug: global.slug,
      isVersions: false,
      payload,
      whereConditionMap,
    })

    if (global.versions) {
      const versionsTableName = db.tableNameMap.get(
        `_${toSnakeCase(global.slug)}${db.versionsSuffix}`,
      )

      const versionFields = buildVersionGlobalFields(global)

      const versionColumnsToCreate: ColumnToCreate[] = []
      const versionWhereConditionMap: WhereConditionMap = new Map()

      traverseFields({
        columnPrefix: '',
        columnsToCreate: versionColumnsToCreate,
        db,
        disableNotNull: true,
        fields: versionFields,
        globalSlug: global.slug,
        isVersions: true,
        newTableName: versionsTableName,
        parentTableName: versionsTableName,
        path: '',
        payload,
        rootTableName: versionsTableName,
        whereConditionMap: versionWhereConditionMap,
      })

      await createColumns({
        columnsToCreate: versionColumnsToCreate,
        db,
        debug,
        dryRun,
        payload,
      })

      await migrateRelationships({
        db,
        debug,
        dryRun,
        fields: versionFields,
        globalSlug: global.slug,
        isVersions: true,
        payload,
        whereConditionMap,
      })
    }
  }
}
