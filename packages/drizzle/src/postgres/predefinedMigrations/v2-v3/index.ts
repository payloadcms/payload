import type { DrizzleSnapshotJSON } from 'drizzle-kit/api'
import type { Payload, PayloadRequest } from 'payload'

import { sql } from 'drizzle-orm'
import fs from 'fs'
import { buildVersionCollectionFields, buildVersionGlobalFields } from 'payload'
import toSnakeCase from 'to-snake-case'

import type { BasePostgresAdapter } from '../../types.js'
import type { PathsToQuery } from './types.js'

import { getTransaction } from '../../../utilities/getTransaction.js'
import { groupUpSQLStatements } from './groupUpSQLStatements.js'
import { migrateRelationships } from './migrateRelationships.js'
import { traverseFields } from './traverseFields.js'

type Args = {
  debug?: boolean
  payload: Payload
  req?: Partial<PayloadRequest>
}

const runStatementGroup = async ({ adapter, db, debug, statements }) => {
  const addColumnsStatement = statements.join('\n')

  if (debug) {
    adapter.payload.logger.info(debug)
    adapter.payload.logger.info(addColumnsStatement)
  }

  await db.execute(sql.raw(addColumnsStatement))
}

/**
 * Moves upload and relationship columns from the join table and into the tables while moving data
 * This is done in the following order:
 *    ADD COLUMNs
 *    -- manipulate data to move relationships to new columns
 *    ADD CONSTRAINTs
 *    NOT NULLs
 *    DROP TABLEs
 *    DROP CONSTRAINTs
 *    DROP COLUMNs
 * @param debug
 * @param payload
 * @param req
 */
export const migratePostgresV2toV3 = async ({ debug, payload, req }: Args) => {
  const adapter = payload.db as unknown as BasePostgresAdapter
  const dir = payload.db.findMigrationDir()

  // get the drizzle migrateUpSQL from drizzle using the last schema
  const { generateDrizzleJson, generateMigration, upSnapshot } = adapter.requireDrizzleKit()
  const drizzleJsonAfter = generateDrizzleJson(adapter.schema) as DrizzleSnapshotJSON

  // Get the previous migration snapshot
  const previousSnapshot = fs
    .readdirSync(dir)
    .filter((file) => file.endsWith('.json') && !file.endsWith('relationships_v2_v3.json'))
    .sort()
    .reverse()?.[0]

  if (!previousSnapshot) {
    throw new Error(
      `No previous migration schema file found! A prior migration from v2 is required to migrate to v3.`,
    )
  }

  let drizzleJsonBefore = JSON.parse(
    fs.readFileSync(`${dir}/${previousSnapshot}`, 'utf8'),
  ) as DrizzleSnapshotJSON

  if (upSnapshot && drizzleJsonBefore.version < drizzleJsonAfter.version) {
    drizzleJsonBefore = upSnapshot(drizzleJsonBefore)
  }

  const generatedSQL = await generateMigration(drizzleJsonBefore, drizzleJsonAfter)

  if (!generatedSQL.length) {
    payload.logger.info(`No schema changes needed.`)
    process.exit(0)
  }

  const sqlUpStatements = groupUpSQLStatements(generatedSQL)

  const db = await getTransaction(adapter, req)

  await runStatementGroup({
    adapter,
    db,
    debug: debug ? 'CREATING TYPES' : null,
    statements: sqlUpStatements.createType,
  })

  await runStatementGroup({
    adapter,
    db,
    debug: debug ? 'ALTERING TYPES' : null,
    statements: sqlUpStatements.alterType,
  })

  await runStatementGroup({
    adapter,
    db,
    debug: debug ? 'CREATING TABLES' : null,
    statements: sqlUpStatements.createTable,
  })

  await runStatementGroup({
    adapter,
    db,
    debug: debug ? 'RENAMING COLUMNS' : null,
    statements: sqlUpStatements.renameColumn,
  })

  await runStatementGroup({
    adapter,
    db,
    debug: debug ? 'CREATING NEW RELATIONSHIP COLUMNS' : null,
    statements: sqlUpStatements.addColumn,
  })

  // SET DEFAULTS
  await runStatementGroup({
    adapter,
    db,
    debug: debug ? 'SETTING DEFAULTS' : null,
    statements: sqlUpStatements.setDefault,
  })

  await runStatementGroup({
    adapter,
    db,
    debug: debug ? 'CREATING INDEXES' : null,
    statements: sqlUpStatements.createIndex,
  })

  for (const collection of payload.config.collections) {
    if (collection.slug === 'payload-locked-documents') {
      continue
    }
    const tableName = adapter.tableNameMap.get(toSnakeCase(collection.slug))
    const pathsToQuery: PathsToQuery = new Set()

    traverseFields({
      adapter,
      collectionSlug: collection.slug,
      columnPrefix: '',
      db,
      disableNotNull: false,
      fields: collection.flattenedFields,
      isVersions: false,
      newTableName: tableName,
      parentTableName: tableName,
      path: '',
      pathsToQuery,
      payload,
      rootTableName: tableName,
    })

    await migrateRelationships({
      adapter,
      collectionSlug: collection.slug,
      db,
      debug,
      fields: collection.flattenedFields,
      isVersions: false,
      pathsToQuery,
      payload,
      req,
      tableName,
    })

    if (collection.versions) {
      const versionsTableName = adapter.tableNameMap.get(
        `_${toSnakeCase(collection.slug)}${adapter.versionsSuffix}`,
      )
      const versionFields = buildVersionCollectionFields(payload.config, collection, true)
      const versionPathsToQuery: PathsToQuery = new Set()

      traverseFields({
        adapter,
        collectionSlug: collection.slug,
        columnPrefix: '',
        db,
        disableNotNull: true,
        fields: versionFields,
        isVersions: true,
        newTableName: versionsTableName,
        parentTableName: versionsTableName,
        path: '',
        pathsToQuery: versionPathsToQuery,
        payload,
        rootTableName: versionsTableName,
      })

      await migrateRelationships({
        adapter,
        collectionSlug: collection.slug,
        db,
        debug,
        fields: versionFields,
        isVersions: true,
        pathsToQuery: versionPathsToQuery,
        payload,
        req,
        tableName: versionsTableName,
      })
    }
  }

  for (const global of payload.config.globals) {
    const tableName = adapter.tableNameMap.get(toSnakeCase(global.slug))

    const pathsToQuery: PathsToQuery = new Set()

    traverseFields({
      adapter,
      columnPrefix: '',
      db,
      disableNotNull: false,
      fields: global.flattenedFields,
      globalSlug: global.slug,
      isVersions: false,
      newTableName: tableName,
      parentTableName: tableName,
      path: '',
      pathsToQuery,
      payload,
      rootTableName: tableName,
    })

    await migrateRelationships({
      adapter,
      db,
      debug,
      fields: global.flattenedFields,
      globalSlug: global.slug,
      isVersions: false,
      pathsToQuery,
      payload,
      req,
      tableName,
    })

    if (global.versions) {
      const versionsTableName = adapter.tableNameMap.get(
        `_${toSnakeCase(global.slug)}${adapter.versionsSuffix}`,
      )

      const versionFields = buildVersionGlobalFields(payload.config, global, true)

      const versionPathsToQuery: PathsToQuery = new Set()

      traverseFields({
        adapter,
        columnPrefix: '',
        db,
        disableNotNull: true,
        fields: versionFields,
        globalSlug: global.slug,
        isVersions: true,
        newTableName: versionsTableName,
        parentTableName: versionsTableName,
        path: '',
        pathsToQuery: versionPathsToQuery,
        payload,
        rootTableName: versionsTableName,
      })

      await migrateRelationships({
        adapter,
        db,
        debug,
        fields: versionFields,
        globalSlug: global.slug,
        isVersions: true,
        pathsToQuery: versionPathsToQuery,
        payload,
        req,
        tableName: versionsTableName,
      })
    }
  }

  // ADD CONSTRAINT
  await runStatementGroup({
    adapter,
    db,
    debug: debug ? 'ADDING CONSTRAINTS' : null,
    statements: sqlUpStatements.addConstraint,
  })

  // NOT NULL
  await runStatementGroup({
    adapter,
    db,
    debug: debug ? 'NOT NULL CONSTRAINTS' : null,
    statements: sqlUpStatements.notNull,
  })

  // DROP TABLE
  await runStatementGroup({
    adapter,
    db,
    debug: debug ? 'DROPPING TABLES' : null,
    statements: sqlUpStatements.dropTable,
  })

  // DROP INDEX
  await runStatementGroup({
    adapter,
    db,
    debug: debug ? 'DROPPING INDEXES' : null,
    statements: sqlUpStatements.dropIndex,
  })

  // DROP CONSTRAINT
  await runStatementGroup({
    adapter,
    db,
    debug: debug ? 'DROPPING CONSTRAINTS' : null,
    statements: sqlUpStatements.dropConstraint,
  })

  // DROP COLUMN
  await runStatementGroup({
    adapter,
    db,
    debug: debug ? 'DROPPING COLUMNS' : null,
    statements: sqlUpStatements.dropColumn,
  })

  // DROP TYPES
  await runStatementGroup({
    adapter,
    db,
    debug: debug ? 'DROPPING TYPES' : null,
    statements: sqlUpStatements.dropType,
  })
}
