import type { Payload } from '../../../../types/index.js'

import { toSnakeCase } from '../shared.js'

/**
 * Migrates main global document from _status to per-locale status object
 */
export async function migrateMainGlobalStatus({
  db,
  globalSlug,
  locales,
  payload,
  sql,
  versionsTable,
}: {
  db: any
  globalSlug: string
  locales: string[]
  payload: Payload
  sql: any
  versionsTable: string
}): Promise<void> {
  const globalTable = toSnakeCase(globalSlug)

  payload.logger.info({ msg: `Migrating main global document for: ${globalTable}` })

  // Get the latest version status per locale for the global
  const latestVersionStatuses = await db.execute({
    drizzle: db.drizzle,
    sql: sql`
      SELECT l._locale, l._status
      FROM ${sql.identifier(versionsTable)} v
      JOIN ${sql.raw(`${versionsTable}_locales`)} l ON l._parent_id = v.id
      ORDER BY v.created_at DESC
      LIMIT ${locales.length}
    `,
  })

  // Build status object { en: 'published', es: 'draft', ... }
  const statusObj: Record<string, string> = {}
  for (const row of latestVersionStatuses.rows) {
    statusObj[row._locale] = row._status
  }

  // If no statuses found, set all to draft
  if (latestVersionStatuses.rows.length === 0) {
    for (const locale of locales) {
      statusObj[locale] = 'draft'
    }
  }

  // Update the global document with the new status object
  await db.execute({
    drizzle: db.drizzle,
    sql: sql`
      UPDATE ${sql.identifier(globalTable)}
      SET status = ${JSON.stringify(statusObj)}
    `,
  })

  payload.logger.info({ msg: 'Migrated global document' })
}
