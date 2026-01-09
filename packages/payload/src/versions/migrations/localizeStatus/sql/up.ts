import type { Payload } from '../../../../types/index.js'

import { calculateVersionLocaleStatuses, toSnakeCase } from '../shared.js'
import { migrateMainCollectionStatus } from './migrateMainCollection.js'
import { migrateMainGlobalStatus } from './migrateMainGlobal.js'

export type LocalizeStatusArgs = {
  collectionSlug?: string
  db: any
  globalSlug?: string
  payload: Payload
  req?: any
  sql: any
}

export async function up(args: LocalizeStatusArgs): Promise<void> {
  const { collectionSlug, db, globalSlug, payload, req, sql } = args

  if (!collectionSlug && !globalSlug) {
    throw new Error('Either collectionSlug or globalSlug must be provided')
  }

  if (collectionSlug && globalSlug) {
    throw new Error('Cannot provide both collectionSlug and globalSlug')
  }

  const entitySlug = collectionSlug || globalSlug
  // Convert camelCase slugs to snake_case and add version prefix/suffix
  const versionsTable = collectionSlug
    ? `_${toSnakeCase(collectionSlug)}_v`
    : `_${toSnakeCase(globalSlug!)}_v`
  const localesTable = `${versionsTable}_locales`

  if (!payload.config.localization) {
    throw new Error('Localization is not enabled in payload config')
  }

  // Check if versions are enabled on this collection/global
  let entityConfig
  if (collectionSlug) {
    const collection = payload.config.collections.find((c) => c.slug === collectionSlug)
    if (collection) {
      entityConfig = collection
    }
  } else if (globalSlug) {
    const global = payload.config.globals.find((g) => g.slug === globalSlug)
    if (global) {
      entityConfig = global
    }
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
    locales = filteredLocaleObjects.map((locale) => locale.code)
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
  const columnCheckResult = await db.execute({
    drizzle: db.drizzle,
    sql: sql`
      SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = ${versionsTable}
        AND column_name = 'version__status'
      ) as exists
    `,
  })

  if (!columnCheckResult.rows[0]?.exists) {
    throw new Error(
      `Migration aborted: version__status column not found in ${versionsTable} table. ` +
        `This migration should only run on schemas that have NOT yet been migrated to per-locale status. ` +
        `If you've already run this migration, no action is needed.`,
    )
  }

  // 1. Check if the locales table exists
  const localesTableCheckResult = await db.execute({
    drizzle: db.drizzle,
    sql: sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = ${localesTable}
      ) as exists
    `,
  })

  const localesTableExists = localesTableCheckResult.rows[0]?.exists

  if (!localesTableExists) {
    // SCENARIO 1: Create the locales table (first localized field in versions)
    payload.logger.info({ msg: `Creating new locales table: ${localesTable}` })

    await db.execute({
      drizzle: db.drizzle,
      sql: sql`
        CREATE TABLE ${sql.identifier(localesTable)} (
          id SERIAL PRIMARY KEY,
          _locale VARCHAR NOT NULL,
          _parent_id INTEGER NOT NULL,
          version__status VARCHAR,
          UNIQUE(_locale, _parent_id),
          FOREIGN KEY (_parent_id) REFERENCES ${sql.identifier(versionsTable)}(id) ON DELETE CASCADE
        )
      `,
    })

    // Create one row per locale per version record
    // Simple approach: copy the same status to all locales
    for (const locale of locales) {
      const inserted = await db.execute({
        drizzle: db.drizzle,
        sql: sql`
          INSERT INTO ${sql.identifier(localesTable)} (_locale, _parent_id, version__status)
          SELECT ${locale}, id, version__status
          FROM ${sql.identifier(versionsTable)}
          RETURNING id
        `,
      })
      payload.logger.info({
        msg: `Inserted ${inserted.length} rows for locale: ${locale}`,
      })
    }
  } else {
    // SCENARIO 2: Add version__status column to existing locales table
    payload.logger.info({ msg: `Adding version__status column to existing table: ${localesTable}` })

    await db.execute({
      drizzle: db.drizzle,
      sql: sql`
        ALTER TABLE ${sql.identifier(localesTable)} ADD COLUMN version__status VARCHAR
      `,
    })

    // INTELLIGENT DATA MIGRATION using historical publishedLocale data
    payload.logger.info({ msg: 'Processing version history to determine status per locale...' })

    // First, get the list of locales that actually exist in the locales table
    // This is important because the config may have more locales defined than what's in the OLD schema
    const existingLocalesResult = await db.execute({
      drizzle: db.drizzle,
      sql: sql`
        SELECT DISTINCT _locale
        FROM ${sql.identifier(localesTable)}
        ORDER BY _locale
      `,
    })
    const existingLocales = existingLocalesResult.rows.map((row: any) => row._locale as string)
    payload.logger.info({
      msg: `Found existing locales in table: ${existingLocales.join(', ')}`,
    })

    // Get all version records grouped by parent document, ordered chronologically
    const versionsResult = await db.execute({
      drizzle: db.drizzle,
      sql: sql`
        SELECT id, parent_id as parent, version__status as _status, published_locale, snapshot, created_at
        FROM ${sql.identifier(versionsTable)}
        ORDER BY parent_id, created_at ASC
      `,
    })

    // Use shared function to calculate version locale statuses
    // Only process locales that actually exist in the locales table
    const versionLocaleStatus = calculateVersionLocaleStatuses(
      versionsResult.rows,
      existingLocales,
      payload,
    )

    // Now update the locales table with the calculated status for each version
    payload.logger.info({ msg: 'Updating locales table with calculated statuses...' })

    let updateCount = 0
    for (const [versionId, localeMap] of versionLocaleStatus.entries()) {
      for (const [locale, status] of localeMap.entries()) {
        await db.execute({
          drizzle: db.drizzle,
          sql: sql`
            UPDATE ${sql.identifier(localesTable)}
            SET version__status = ${status}
            WHERE _parent_id = ${versionId}
            AND _locale = ${locale}
          `,
        })
        updateCount++
      }
    }

    payload.logger.info({ msg: `Updated ${updateCount} locale rows with status` })
  }

  // 3. Drop the old version__status column from main versions table
  await db.execute({
    drizzle: db.drizzle,
    sql: sql`
      ALTER TABLE ${sql.identifier(versionsTable)} DROP COLUMN version__status
    `,
  })

  // 4. Create and populate _status column in main collection/global locales table
  // With localizeStatus enabled, _status is a localized field stored in the collection's locales table
  // We need to create this column and populate it based on the latest version status per locale
  const mainTable = collectionSlug ? toSnakeCase(collectionSlug) : toSnakeCase(globalSlug!)
  const mainLocalesTable = `${mainTable}_locales`

  const localesTableCheck = await db.execute({
    drizzle: db.drizzle,
    sql: sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = ${mainLocalesTable}
      ) as exists
    `,
  })

  if (localesTableCheck.rows[0]?.exists) {
    // Check if _status column already exists in the locales table
    const statusColumnCheck = await db.execute({
      drizzle: db.drizzle,
      sql: sql`
        SELECT EXISTS (
          SELECT FROM information_schema.columns
          WHERE table_schema = 'public'
          AND table_name = ${mainLocalesTable}
          AND column_name = '_status'
        ) as exists
      `,
    })

    if (!statusColumnCheck.rows[0]?.exists) {
      // Add _status column to locales table
      await db.execute({
        drizzle: db.drizzle,
        sql: sql`
          ALTER TABLE ${sql.identifier(mainLocalesTable)}
          ADD COLUMN _status VARCHAR DEFAULT 'draft'
        `,
      })
    }

    // Now populate the _status values from the latest version
    if (collectionSlug) {
      await migrateMainCollectionStatus({
        collectionSlug,
        db,
        locales,
        payload,
        sql,
        versionsTable,
      })
    } else if (globalSlug) {
      await migrateMainGlobalStatus({ db, globalSlug, locales, payload, sql, versionsTable })
    }
  } else {
    payload.logger.info({
      msg: `No locales table found: ${mainLocalesTable} (collection/global not localized)`,
    })
  }

  // 5. Drop _status from main table if it exists (it will be in locales table now)
  const mainTableStatusCheck = await db.execute({
    drizzle: db.drizzle,
    sql: sql`
      SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = ${mainTable}
        AND column_name = '_status'
      ) as exists
    `,
  })

  if (mainTableStatusCheck.rows[0]?.exists) {
    await db.execute({
      drizzle: db.drizzle,
      sql: sql`
        ALTER TABLE ${sql.identifier(mainTable)} DROP COLUMN _status
      `,
    })
  }

  payload.logger.info({ msg: 'Migration completed successfully' })
}
