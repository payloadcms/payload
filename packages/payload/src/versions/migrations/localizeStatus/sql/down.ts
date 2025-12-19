import type { Payload } from '../../../../types/index.js'

import { hasLocalizeStatusEnabled } from '../../../../utilities/getVersionsConfig.js'
import { toSnakeCase } from '../shared.js'

export type LocalizeStatusArgs = {
  collectionSlug?: string
  db: any
  globalSlug?: string
  payload: Payload
  req?: any
  sql: any
}

export async function down(args: LocalizeStatusArgs): Promise<void> {
  const { collectionSlug, db, globalSlug, payload, sql } = args

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

  const entityConfig = collectionSlug
    ? payload.config.collections.find((c) => c.slug === collectionSlug)
    : payload.config.globals.find((g) => g.slug === globalSlug!)

  if (!entityConfig) {
    throw new Error(
      `${collectionSlug ? 'Collection' : 'Global'} not found: ${collectionSlug || globalSlug}`,
    )
  }

  if (hasLocalizeStatusEnabled(entityConfig)) {
    throw new Error(
      `${entitySlug} has localizeStatus enabled, cannot run down migration. ` +
        `Please disable localizeStatus in your config before rolling back this migration.`,
    )
  }

  const defaultLocale = payload.config.localization.defaultLocale

  payload.logger.info({
    msg: `Rolling back _status localization migration for ${collectionSlug ? 'collection' : 'global'}: ${entitySlug}`,
  })

  // 1. Restore version__status column to main table
  payload.logger.info({ msg: `Restoring version__status column to ${versionsTable}` })

  await db.execute({
    drizzle: db.drizzle,
    sql: sql`
      ALTER TABLE ${sql.identifier(versionsTable)} ADD COLUMN version__status VARCHAR
    `,
  })

  // 2. Copy status from default locale back to main table
  payload.logger.info({
    msg: `Copying status from default locale (${defaultLocale}) back to main table`,
  })

  await db.execute({
    drizzle: db.drizzle,
    sql: sql`
      UPDATE ${sql.identifier(versionsTable)} pv
      SET version__status = pl.version__status
      FROM ${sql.identifier(localesTable)} pl
      WHERE pv.id = pl._parent_id
      AND pl._locale = ${defaultLocale}
    `,
  })

  // 3. Check if there are other localized fields besides version__status
  const columnCheckResult = await db.execute({
    drizzle: db.drizzle,
    sql: sql`
      SELECT COUNT(*) as count
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = ${localesTable}
      AND column_name NOT IN ('id', '_locale', '_parent_id', 'version__status')
    `,
  })

  const hasOtherLocalizedFields = Number(columnCheckResult.rows[0]?.count) > 0

  if (!hasOtherLocalizedFields) {
    // SCENARIO 1 ROLLBACK: No other localized fields, drop entire table
    payload.logger.info({ msg: `Dropping entire locales table: ${localesTable}` })

    await db.execute({
      drizzle: db.drizzle,
      sql: sql`DROP TABLE ${sql.identifier(localesTable)} CASCADE`,
    })
  } else {
    // SCENARIO 2 ROLLBACK: Other localized fields exist, just drop version__status column
    payload.logger.info({ msg: `Dropping version__status column from ${localesTable}` })

    await db.execute({
      drizzle: db.drizzle,
      sql: sql`
        ALTER TABLE ${sql.identifier(localesTable)} DROP COLUMN version__status
      `,
    })
  }

  // 4. Restore _status to main collection/global table if it was dropped
  const mainTable = collectionSlug ? toSnakeCase(collectionSlug) : toSnakeCase(globalSlug!)
  const mainLocalesTable = `${mainTable}_locales`

  // Check if _status exists in the main table
  const statusInMainTableCheck = await db.execute({
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

  if (!statusInMainTableCheck.rows[0]?.exists) {
    // _status column doesn't exist in main table, need to restore it
    // Check if main collection/global has a locales table
    const mainLocalesTableCheck = await db.execute({
      drizzle: db.drizzle,
      sql: sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = ${mainLocalesTable}
        ) as exists
      `,
    })

    if (mainLocalesTableCheck.rows[0]?.exists) {
      // Locales table exists - check if _status is there
      const statusInLocalesCheck = await db.execute({
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

      if (statusInLocalesCheck.rows[0]?.exists) {
        // Add _status back to main table
        payload.logger.info({ msg: `Restoring _status column to ${mainTable}` })

        await db.execute({
          drizzle: db.drizzle,
          sql: sql`
            ALTER TABLE ${sql.identifier(mainTable)} ADD COLUMN _status VARCHAR
          `,
        })

        // Copy status from default locale back to main table
        await db.execute({
          drizzle: db.drizzle,
          sql: sql`
            UPDATE ${sql.identifier(mainTable)} m
            SET _status = l._status
            FROM ${sql.identifier(mainLocalesTable)} l
            WHERE m.id = l._parent_id
            AND l._locale = ${defaultLocale}
          `,
        })

        // Drop _status from locales table
        payload.logger.info({ msg: `Dropping _status column from ${mainLocalesTable}` })

        await db.execute({
          drizzle: db.drizzle,
          sql: sql`
            ALTER TABLE ${sql.identifier(mainLocalesTable)} DROP COLUMN _status
          `,
        })
      }
    } else {
      // No locales table exists - this means collection/global has no localized fields
      // Just add _status back to main table with default values
      payload.logger.info({
        msg: `Restoring _status column to ${mainTable} (no locales table exists)`,
      })

      await db.execute({
        drizzle: db.drizzle,
        sql: sql`
          ALTER TABLE ${sql.identifier(mainTable)} ADD COLUMN _status VARCHAR
        `,
      })

      // Set default status based on latest version status for each document
      // Get all documents in the collection
      const documents = await db.execute({
        drizzle: db.drizzle,
        sql: sql`
          SELECT DISTINCT id
          FROM ${sql.identifier(mainTable)}
        `,
      })

      for (const doc of documents.rows) {
        // Get latest version status for this document
        const latestVersionStatus = await db.execute({
          drizzle: db.drizzle,
          sql: sql`
            SELECT version__status
            FROM ${sql.identifier(versionsTable)}
            WHERE parent_id = ${doc.id}
            ORDER BY created_at DESC
            LIMIT 1
          `,
        })

        const status = latestVersionStatus.rows[0]?.version__status || 'draft'

        await db.execute({
          drizzle: db.drizzle,
          sql: sql`
            UPDATE ${sql.identifier(mainTable)}
            SET _status = ${status}
            WHERE id = ${doc.id}
          `,
        })
      }

      payload.logger.info({ msg: `Restored _status for ${documents.rows.length} documents` })
    }
  }

  payload.logger.info({ msg: 'Rollback completed successfully' })
}
