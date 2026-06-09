import type { Payload, PayloadRequest } from 'payload'

import { sql } from 'drizzle-orm'
import { calculateVersionLocaleStatuses, toSnakeCase } from 'payload/migrations'

/**
 * Migrate all collections and globals with versions.drafts enabled to use per-locale _status.
 *
 * This migration:
 * 1. Converts version._status from a scalar string to a locale-keyed object for each entity
 * 2. Deletes all snapshot=true rows from each version table
 * 3. Drops the `snapshot` column from each version table
 */
export async function migrateLocalizeStatus({
  db,
  payload,
  req,
}: {
  db: any
  payload: Payload
  req: PayloadRequest
}): Promise<void> {
  if (!payload.config.localization) {
    payload.logger.info({
      msg: 'Localization not enabled, skipping localize-status migration',
    })
    return
  }

  const collections = payload.config.collections.filter((c) => c.versions?.drafts)
  const globals = payload.config.globals.filter((g) => g.versions?.drafts)

  payload.logger.info({
    msg: `Starting localize-status migration for ${collections.length} collection(s) and ${globals.length} global(s)`,
  })

  for (const collection of collections) {
    await _migrateEntity({ slug: collection.slug, db, entityType: 'collection', payload, req })
    await _cleanupSnapshotColumn({
      db,
      payload,
      versionsTable: `_${toSnakeCase(collection.slug)}_v`,
    })
  }

  for (const global of globals) {
    await _migrateEntity({ slug: global.slug, db, entityType: 'global', payload, req })
    await _cleanupSnapshotColumn({
      db,
      payload,
      versionsTable: `_${toSnakeCase(global.slug)}_v`,
    })
  }

  payload.logger.info({ msg: 'localize-status migration completed successfully' })
}

async function _columnExists({
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

async function _tableExists({ db, tableName }: { db: any; tableName: string }): Promise<boolean> {
  const result = await db.all(
    sql.raw(
      `SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name='${tableName}'`,
    ),
  )
  return Number(result[0]?.count ?? 0) > 0
}

async function _migrateEntity({
  slug,
  db,
  entityType,
  payload,
  req,
}: {
  db: any
  entityType: 'collection' | 'global'
  payload: Payload
  req: PayloadRequest
  slug: string
}): Promise<void> {
  const versionsTable =
    entityType === 'collection' ? `_${toSnakeCase(slug)}_v` : `_${toSnakeCase(slug)}_v`
  const localesTable = `${versionsTable}_locales`

  if (!payload.config.localization) {
    return
  }

  let entityConfig: any
  if (entityType === 'collection') {
    entityConfig = payload.config.collections.find((c) => c.slug === slug)
  } else {
    entityConfig = payload.config.globals.find((g) => g.slug === slug)
  }

  if (!entityConfig?.versions) {
    payload.logger.info({
      msg: `Skipping migration for ${entityType}: ${slug} - versions not enabled`,
    })
    return
  }

  payload.logger.info({
    msg: `Starting _status localization migration for ${entityType}: ${slug}`,
  })

  // Get filtered locales if filterAvailableLocales is defined
  let locales = payload.config.localization.localeCodes
  if (typeof payload.config.localization.filterAvailableLocales === 'function') {
    const filteredLocaleObjects = await payload.config.localization.filterAvailableLocales({
      locales: payload.config.localization.locales,
      req,
    })
    locales = filteredLocaleObjects.map((locale: any) =>
      typeof locale === 'string' ? locale : locale.code,
    )
  }

  // Validate that version__status column exists before proceeding
  if (!(await _columnExists({ columnName: 'version__status', db, tableName: versionsTable }))) {
    throw new Error(
      `Migration aborted: version__status column not found in ${versionsTable} table. ` +
        `This migration should only run on schemas that have NOT yet been migrated to per-locale status.`,
    )
  }

  const localesTableAlreadyExists = await _tableExists({ db, tableName: localesTable })

  if (!localesTableAlreadyExists) {
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

    const versionRows: any[] = await db.all(
      sql.raw(
        `SELECT id, parent_id as parent, version__status as _status, published_locale, snapshot, created_at FROM "${versionsTable}" ORDER BY parent_id, created_at ASC`,
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
  await db.run(sql.raw(`ALTER TABLE "${versionsTable}" DROP COLUMN version__status`))

  // Migrate main table _status to locales table
  const mainTable = toSnakeCase(slug)
  const mainLocalesTable = `${mainTable}_locales`

  if (await _tableExists({ db, tableName: mainLocalesTable })) {
    if (!(await _columnExists({ columnName: '_status', db, tableName: mainLocalesTable }))) {
      await db.run(
        sql.raw(`ALTER TABLE "${mainLocalesTable}" ADD COLUMN _status TEXT DEFAULT 'draft'`),
      )
    }

    if (entityType === 'collection') {
      await _migrateMainCollectionStatus({
        db,
        locales,
        mainLocalesTable,
        mainTable,
        payload,
        versionsTable,
      })
    } else {
      await _migrateMainGlobalStatus({
        db,
        locales,
        mainLocalesTable,
        mainTable,
        payload,
        versionsTable,
      })
    }
  } else {
    payload.logger.info({
      msg: `No locales table found: ${mainLocalesTable} (entity not localized)`,
    })
  }

  // Drop _status from main table if it exists (it will be in locales table now)
  if (await _columnExists({ columnName: '_status', db, tableName: mainTable })) {
    await db.run(sql.raw(`ALTER TABLE "${mainTable}" DROP COLUMN _status`))
  }

  payload.logger.info({ msg: `Migration completed for ${entityType}: ${slug}` })
}

async function _migrateMainCollectionStatus({
  db,
  locales,
  mainLocalesTable,
  mainTable,
  payload,
  versionsTable,
}: {
  db: any
  locales: string[]
  mainLocalesTable: string
  mainTable: string
  payload: Payload
  versionsTable: string
}): Promise<void> {
  payload.logger.info({ msg: `Migrating main collection locales for: ${mainLocalesTable}` })

  const documents: any[] = await db.all(sql.raw(`SELECT DISTINCT id FROM "${mainTable}"`))

  for (const doc of documents) {
    for (const locale of locales) {
      const latestVersionRows: any[] = await db.all(
        sql.raw(
          `SELECT l.version__status as _status FROM "${versionsTable}" v JOIN "${versionsTable}_locales" l ON l._parent_id = v.id WHERE v.parent_id = ${doc.id} AND l._locale = '${locale}' ORDER BY v.created_at DESC LIMIT 1`,
        ),
      )

      const status = latestVersionRows[0]?._status || 'draft'

      await db.run(
        sql.raw(
          `UPDATE "${mainLocalesTable}" SET _status = '${status}' WHERE _parent_id = ${doc.id} AND _locale = '${locale}'`,
        ),
      )
    }
  }

  payload.logger.info({ msg: `Migrated ${documents.length} collection documents` })
}

async function _migrateMainGlobalStatus({
  db,
  locales,
  mainLocalesTable,
  mainTable,
  payload,
  versionsTable,
}: {
  db: any
  locales: string[]
  mainLocalesTable: string
  mainTable: string
  payload: Payload
  versionsTable: string
}): Promise<void> {
  payload.logger.info({ msg: `Migrating main global locales for: ${mainLocalesTable}` })

  const globalDoc: any = await db.get(sql.raw(`SELECT id FROM "${mainTable}" LIMIT 1`))

  if (!globalDoc) {
    payload.logger.warn({ msg: `No global document found for ${mainTable}, skipping` })
    return
  }

  for (const locale of locales) {
    const latestVersionRows: any[] = await db.all(
      sql.raw(
        `SELECT l.version__status as _status FROM "${versionsTable}" v JOIN "${versionsTable}_locales" l ON l._parent_id = v.id WHERE l._locale = '${locale}' ORDER BY v.created_at DESC LIMIT 1`,
      ),
    )

    const status = latestVersionRows[0]?._status || 'draft'

    await db.run(
      sql.raw(
        `UPDATE "${mainLocalesTable}" SET _status = '${status}' WHERE _parent_id = ${globalDoc.id} AND _locale = '${locale}'`,
      ),
    )
  }

  payload.logger.info({ msg: 'Migrated global document' })
}

async function _cleanupSnapshotColumn({
  db,
  payload,
  versionsTable,
}: {
  db: any
  payload: Payload
  versionsTable: string
}): Promise<void> {
  if (!(await _columnExists({ columnName: 'snapshot', db, tableName: versionsTable }))) {
    return
  }

  // In SQLite, booleans are stored as integers (1 = true)
  await db.run(sql.raw(`DELETE FROM "${versionsTable}" WHERE snapshot = 1`))

  payload.logger.info({
    msg: `Deleted snapshot rows from ${versionsTable}`,
  })

  await db.run(sql.raw(`ALTER TABLE "${versionsTable}" DROP COLUMN snapshot`))

  payload.logger.info({ msg: `Dropped snapshot column from ${versionsTable}` })
}
