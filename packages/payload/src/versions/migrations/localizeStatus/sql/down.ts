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
      SET version__status = pl._status
      FROM ${sql.identifier(localesTable)} pl
      WHERE pv.id = pl._parent_id
      AND pl._locale = ${defaultLocale}
    `,
  })

  // 3. Check if there are other localized fields besides _status
  const columnCheckResult = await db.execute({
    drizzle: db.drizzle,
    sql: sql`
      SELECT COUNT(*) as count
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = ${localesTable}
      AND column_name NOT IN ('id', '_locale', '_parent_id', '_status')
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
    // SCENARIO 2 ROLLBACK: Other localized fields exist, just drop _status column
    payload.logger.info({ msg: `Dropping _status column from ${localesTable}` })

    await db.execute({
      drizzle: db.drizzle,
      sql: sql`
        ALTER TABLE ${sql.identifier(localesTable)} DROP COLUMN _status
      `,
    })
  }

  payload.logger.info({ msg: 'Rollback completed successfully' })
}
