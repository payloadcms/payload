import type { BasePostgresAdapter, PostgresDB } from '@payloadcms/drizzle/postgres'
import type { Payload, PayloadRequest } from 'payload'

import { migratePostgresLocalizeStatus } from '@payloadcms/drizzle/postgres'
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
  sql,
}: {
  /**
   * The Drizzle instance from the migration arguments, so every query runs in the migration's transaction
   */
  db: PostgresDB
  payload: Payload
  req: PayloadRequest
  sql: any
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
    await migratePostgresLocalizeStatus({ collectionSlug: collection.slug, db, payload, req, sql })
    await _cleanupSnapshotColumn({
      db,
      payload,
      sql,
      versionsTable: `_${toSnakeCase(collection.slug)}_v`,
    })
  }

  for (const global of globals) {
    await migratePostgresLocalizeStatus({ db, globalSlug: global.slug, payload, req, sql })
    await _cleanupSnapshotColumn({
      db,
      payload,
      sql,
      versionsTable: `_${toSnakeCase(global.slug)}_v`,
    })
  }

  payload.logger.info({ msg: 'localize-status migration completed successfully' })
}

async function _cleanupSnapshotColumn({
  db,
  payload,
  sql,
  versionsTable,
}: {
  db: PostgresDB
  payload: Payload
  sql: any
  versionsTable: string
}): Promise<void> {
  const schemaName = (payload.db as unknown as BasePostgresAdapter).schemaName || 'public'

  const columnCheck = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_schema = ${schemaName}
        AND table_name = ${versionsTable}
        AND column_name = 'snapshot'
      ) as exists
    `)

  if (!columnCheck.rows[0]?.exists) {
    return
  }

  const deleteResult = await db.execute(sql`
      DELETE FROM ${sql.identifier(versionsTable)} WHERE snapshot = true
    `)

  if (deleteResult.rowCount) {
    payload.logger.info({
      msg: `Deleted ${deleteResult.rowCount} snapshot rows from ${versionsTable}`,
    })
  }

  await db.execute(sql`
      ALTER TABLE ${sql.identifier(versionsTable)} DROP COLUMN snapshot
    `)

  payload.logger.info({ msg: `Dropped snapshot column from ${versionsTable}` })
}
