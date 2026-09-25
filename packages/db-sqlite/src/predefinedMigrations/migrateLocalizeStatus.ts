import type { Payload, PayloadRequest } from 'payload'

import { migrateSqliteLocalizeStatus } from '@payloadcms/drizzle/sqlite'
import { sql } from 'drizzle-orm'
import { toSnakeCase } from 'payload/migrations'

/**
 * Migrate all collections and globals with per-locale status enabled to use per-locale _status.
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

  const collections = payload.config.collections.filter(
    (c) =>
      c.versions?.drafts &&
      typeof c.versions.drafts === 'object' &&
      c.versions.drafts.localizeStatus,
  )
  const globals = payload.config.globals.filter(
    (g) =>
      g.versions?.drafts &&
      typeof g.versions.drafts === 'object' &&
      g.versions.drafts.localizeStatus,
  )

  payload.logger.info({
    msg: `Starting localize-status migration for ${collections.length} collection(s) and ${globals.length} global(s)`,
  })

  for (const collection of collections) {
    await migrateSqliteLocalizeStatus({ collectionSlug: collection.slug, db, payload, req })
    await _cleanupSnapshotColumn({
      db,
      payload,
      versionsTable: `_${toSnakeCase(collection.slug)}_v`,
    })
  }

  for (const global of globals) {
    await migrateSqliteLocalizeStatus({ db, globalSlug: global.slug, payload, req })
    await _cleanupSnapshotColumn({
      db,
      payload,
      versionsTable: `_${toSnakeCase(global.slug)}_v`,
    })
  }

  payload.logger.info({ msg: 'localize-status migration completed successfully' })
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
  const columnCheck: any[] = await db.all(
    sql.raw(
      `SELECT COUNT(*) as count FROM pragma_table_info('${versionsTable}') WHERE name = 'snapshot'`,
    ),
  )

  if (Number(columnCheck[0]?.count ?? 0) === 0) {
    return
  }

  await db.run(sql.raw(`DELETE FROM "${versionsTable}" WHERE snapshot = 1`))

  await db.run(sql.raw(`ALTER TABLE "${versionsTable}" DROP COLUMN snapshot`))

  payload.logger.info({ msg: `Dropped snapshot column from ${versionsTable}` })
}
