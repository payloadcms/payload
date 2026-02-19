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
  const globalLocalesTable = `${globalTable}_locales`

  payload.logger.info({ msg: `Migrating main global locales for: ${globalLocalesTable}` })

  // For each locale, get the latest version status
  for (const locale of locales) {
    const latestVersionStatus = await db.execute({
      drizzle: db.drizzle,
      sql: sql`
        SELECT l.version__status as _status
        FROM ${sql.identifier(versionsTable)} v
        JOIN ${sql.raw(`${versionsTable}_locales`)} l ON l._parent_id = v.id
        WHERE l._locale = ${locale}
        ORDER BY v.created_at DESC
        LIMIT 1
      `,
    })

    const status = latestVersionStatus.rows[0]?._status || 'draft'

    // Get the global document ID from the globals table
    const globalDoc = await db.execute({
      drizzle: db.drizzle,
      sql: sql`
        SELECT id FROM ${sql.identifier(globalTable)} LIMIT 1
      `,
    })

    if (globalDoc.rows.length === 0) {
      payload.logger.warn({ msg: `No global document found for ${globalSlug}, skipping` })
      continue
    }

    const globalId = globalDoc.rows[0].id

    // Update the global's locales table with this status
    await db.execute({
      drizzle: db.drizzle,
      sql: sql`
        UPDATE ${sql.identifier(globalLocalesTable)}
        SET _status = ${status}
        WHERE _parent_id = ${globalId}
        AND _locale = ${locale}
      `,
    })
  }

  payload.logger.info({ msg: 'Migrated global document' })
}
