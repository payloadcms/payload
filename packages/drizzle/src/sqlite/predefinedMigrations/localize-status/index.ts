import type { Payload } from 'payload'

import { sql } from 'drizzle-orm'
import { calculateVersionLocaleStatuses } from 'payload/migrations'
import toSnakeCase from 'to-snake-case'

import { migrateMainCollectionStatus } from './migrateMainCollection.js'
import { migrateMainGlobalStatus } from './migrateMainGlobal.js'

export type LocalizeStatusArgs = {
  collectionSlug?: string
  db: any
  globalSlug?: string
  payload: Payload
  req?: any
}

export async function migrateSqliteLocalizeStatus(args: LocalizeStatusArgs): Promise<void> {
  const { collectionSlug, db, globalSlug, payload, req } = args

  if (!collectionSlug && !globalSlug) {
    throw new Error('Either collectionSlug or globalSlug must be provided')
  }

  if (collectionSlug && globalSlug) {
    throw new Error('Cannot provide both collectionSlug and globalSlug')
  }

  const entitySlug = collectionSlug || globalSlug
  const versionsTable = collectionSlug
    ? `_${toSnakeCase(collectionSlug)}_v`
    : `_${toSnakeCase(globalSlug)}_v`
  const localesTable = `${versionsTable}_locales`

  if (!payload.config.localization) {
    throw new Error('Localization is not enabled in payload config')
  }

  // Check if versions are enabled on this collection/global
  let entityConfig
  if (collectionSlug) {
    entityConfig = payload.config.collections.find((c) => c.slug === collectionSlug)
  } else if (globalSlug) {
    entityConfig = payload.config.globals.find((g) => g.slug === globalSlug)
  }

  if (!entityConfig) {
    throw new Error(
      `${collectionSlug ? 'Collection' : 'Global'} not found: ${collectionSlug || globalSlug}`,
    )
  }

  payload.logger.info({
    msg: `Starting _status localization migration for ${collectionSlug ? 'collection' : 'global'}: ${entitySlug}`,
  })

  // Get filtered locales if filterAvailableLocales is defined
  let locales = payload.config.localization.localeCodes
  if (typeof payload.config.localization.filterAvailableLocales === 'function') {
    const filteredLocaleObjects = await payload.config.localization.filterAvailableLocales({
      locales: payload.config.localization.locales,
      req,
    })
    locales = filteredLocaleObjects.map((locale) =>
      typeof locale === 'string' ? locale : locale.code,
    )
  }
  payload.logger.info({ msg: `Locales: ${locales.join(', ')}` })

  // Check if versions are enabled in config (skip if not)
  if (!entityConfig.versions) {
    payload.logger.info({
      msg: `Skipping migration for ${collectionSlug ? 'collection' : 'global'}: ${entitySlug} - versions not enabled`,
    })
    return
  }

  // Validate that version__status column exists before proceeding
  if (!(await columnExists({ columnName: 'version__status', db, tableName: versionsTable }))) {
    throw new Error(
      `Migration aborted: version__status column not found in ${versionsTable} table. ` +
        `This migration should only run on schemas that have NOT yet been migrated to per-locale status. ` +
        `If you've already run this migration, no action is needed.`,
    )
  }

  const localesTableExists = await tableExists({ db, tableName: localesTable })

  if (!localesTableExists) {
    // SCENARIO 1: Create the locales table (first localized field in versions)
    payload.logger.info({ msg: `Creating new locales table: ${localesTable}` })

    await db.run(
      sql.raw(`CREATE TABLE "${localesTable}" (
        id INTEGER PRIMARY KEY,
        _locale TEXT NOT NULL,
        _parent_id INTEGER NOT NULL,
        version__status TEXT,
        UNIQUE(_locale, _parent_id),
        FOREIGN KEY (_parent_id) REFERENCES "${versionsTable}"(id) ON DELETE CASCADE
      )`),
    )

    for (const locale of locales) {
      const inserted: any[] = await db.all(
        sql.raw(
          `INSERT INTO "${localesTable}" (_locale, _parent_id, version__status) SELECT '${locale}', id, version__status FROM "${versionsTable}" RETURNING id`,
        ),
      )
      payload.logger.info({
        msg: `Inserted ${inserted.length} rows for locale: ${locale}`,
      })
    }
  } else {
    // SCENARIO 2: Add version__status column to existing locales table
    payload.logger.info({ msg: `Adding version__status column to existing table: ${localesTable}` })

    await db.run(sql.raw(`ALTER TABLE "${localesTable}" ADD COLUMN version__status TEXT`))

    payload.logger.info({ msg: 'Processing version history to determine status per locale...' })

    const existingLocaleRows: any[] = await db.all(
      sql.raw(`SELECT DISTINCT _locale FROM "${localesTable}" ORDER BY _locale`),
    )
    const existingLocales = existingLocaleRows.map((row: any) => row._locale as string)
    payload.logger.info({
      msg: `Found existing locales in table: ${existingLocales.join(', ')}`,
    })

    // Check if the snapshot column exists (only present on DBs that used publishSpecificLocale)
    const hasSnapshotColumn = await columnExists({
      columnName: 'snapshot',
      db,
      tableName: versionsTable,
    })

    const versionRows: any[] = await db.all(
      sql.raw(
        hasSnapshotColumn
          ? `SELECT id, parent_id as parent, version__status as _status, published_locale, snapshot, created_at FROM "${versionsTable}" ORDER BY parent_id, created_at ASC`
          : `SELECT id, parent_id as parent, version__status as _status, published_locale, created_at FROM "${versionsTable}" ORDER BY parent_id, created_at ASC`,
      ),
    )

    const versionLocaleStatus = calculateVersionLocaleStatuses(
      versionRows,
      existingLocales,
      payload,
    )

    payload.logger.info({ msg: 'Updating locales table with calculated statuses...' })

    let updateCount = 0
    for (const [versionId, localeMap] of versionLocaleStatus.entries()) {
      for (const [locale, status] of localeMap.entries()) {
        await db.run(
          sql.raw(
            `UPDATE "${localesTable}" SET version__status = '${status}' WHERE _parent_id = ${versionId} AND _locale = '${locale}'`,
          ),
        )
        updateCount++
      }
    }

    payload.logger.info({ msg: `Updated ${updateCount} locale rows with status` })
  }

  // Drop the old version__status column from the versions table
  await dropColumn({ columnName: 'version__status', db, tableName: versionsTable })

  // Migrate main table _status to locales table
  const mainTable = collectionSlug ? toSnakeCase(collectionSlug) : toSnakeCase(globalSlug)
  const mainLocalesTable = `${mainTable}_locales`

  if (await tableExists({ db, tableName: mainLocalesTable })) {
    if (!(await columnExists({ columnName: '_status', db, tableName: mainLocalesTable }))) {
      await db.run(
        sql.raw(`ALTER TABLE "${mainLocalesTable}" ADD COLUMN _status TEXT DEFAULT 'draft'`),
      )
    }

    if (collectionSlug) {
      await migrateMainCollectionStatus({
        collectionSlug,
        db,
        locales,
        payload,
        versionsTable,
      })
    } else if (globalSlug) {
      await migrateMainGlobalStatus({ db, globalSlug, locales, payload, versionsTable })
    }
  } else {
    payload.logger.info({
      msg: `No locales table found: ${mainLocalesTable} (collection/global not localized)`,
    })
  }

  // Drop _status from main table if it exists (it will be in locales table now)
  if (await columnExists({ columnName: '_status', db, tableName: mainTable })) {
    await dropColumn({ columnName: '_status', db, tableName: mainTable })
  }

  payload.logger.info({ msg: 'Migration completed successfully' })
}

/**
 * Drops a column, first removing any indexes that reference it. SQLite refuses to
 * drop a column that is still referenced by an index.
 */
export async function dropColumn({
  columnName,
  db,
  tableName,
}: {
  columnName: string
  db: any
  tableName: string
}): Promise<void> {
  const indexes = await db.all(
    sql.raw(`SELECT name, sql FROM sqlite_master WHERE type='index' AND tbl_name='${tableName}'`),
  )

  for (const index of indexes as Array<{ name: string; sql: null | string }>) {
    if (typeof index.sql === 'string' && index.sql.includes(columnName)) {
      await db.run(sql.raw(`DROP INDEX IF EXISTS "${index.name}"`))
    }
  }

  await db.run(sql.raw(`ALTER TABLE "${tableName}" DROP COLUMN ${columnName}`))
}

export async function columnExists({
  columnName,
  db,
  tableName,
}: {
  columnName: string
  db: any
  tableName: string
}): Promise<boolean> {
  const result = await db.all(
    sql.raw(
      `SELECT COUNT(*) as count FROM pragma_table_info('${tableName}') WHERE name = '${columnName}'`,
    ),
  )
  return Number(result[0]?.count ?? 0) > 0
}

export async function tableExists({
  db,
  tableName,
}: {
  db: any
  tableName: string
}): Promise<boolean> {
  const result = await db.all(
    sql.raw(
      `SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name='${tableName}'`,
    ),
  )
  return Number(result[0]?.count ?? 0) > 0
}
