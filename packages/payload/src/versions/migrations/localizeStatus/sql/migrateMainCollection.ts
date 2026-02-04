import type { Payload } from '../../../../types/index.js'

import { toSnakeCase } from '../shared.js'

/**
 * Migrates main collection documents from _status to per-locale status object
 */
export async function migrateMainCollectionStatus({
  collectionSlug,
  db,
  locales,
  payload,
  sql,
  versionsTable,
}: {
  collectionSlug: string
  db: any
  locales: string[]
  payload: Payload
  sql: any
  versionsTable: string
}): Promise<void> {
  const mainTable = toSnakeCase(collectionSlug)
  const mainLocalesTable = `${mainTable}_locales`

  payload.logger.info({ msg: `Migrating main collection locales for: ${mainLocalesTable}` })

  // Get all documents
  const documents = await db.execute({
    drizzle: db.drizzle,
    sql: sql`
      SELECT DISTINCT id
      FROM ${sql.identifier(mainTable)}
    `,
  })

  for (const doc of documents.rows) {
    // For each locale, get the latest version status
    for (const locale of locales) {
      const latestVersionStatus = await db.execute({
        drizzle: db.drizzle,
        sql: sql`
          SELECT l.version__status as _status
          FROM ${sql.identifier(versionsTable)} v
          JOIN ${sql.raw(`${versionsTable}_locales`)} l ON l._parent_id = v.id
          WHERE v.parent_id = ${doc.id}
          AND l._locale = ${locale}
          ORDER BY v.created_at DESC
          LIMIT 1
        `,
      })

      const status = latestVersionStatus.rows[0]?._status || 'draft'

      // Update the main collection's locales table with this status
      await db.execute({
        drizzle: db.drizzle,
        sql: sql`
          UPDATE ${sql.identifier(mainLocalesTable)}
          SET _status = ${status}
          WHERE _parent_id = ${doc.id}
          AND _locale = ${locale}
        `,
      })
    }
  }

  payload.logger.info({ msg: `Migrated ${documents.rows.length} collection documents` })
}
