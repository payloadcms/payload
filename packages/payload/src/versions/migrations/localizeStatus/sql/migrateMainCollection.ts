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

  payload.logger.info({ msg: `Migrating main collection documents for: ${mainTable}` })

  // Get all documents with their latest version status per locale
  const documents = await db.execute({
    drizzle: db.drizzle,
    sql: sql`
      SELECT DISTINCT doc.id
      FROM ${sql.identifier(mainTable)} doc
    `,
  })

  for (const doc of documents.rows) {
    // Get the latest version for this document and check published status per locale
    const latestVersionStatuses = await db.execute({
      drizzle: db.drizzle,
      sql: sql`
        SELECT l._locale, l._status
        FROM ${sql.identifier(versionsTable)} v
        JOIN ${sql.raw(`${versionsTable}_locales`)} l ON l._parent_id = v.id
        WHERE v.parent_id = ${doc.id}
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

    // Update the document with the new status object
    await db.execute({
      drizzle: db.drizzle,
      sql: sql`
        UPDATE ${sql.identifier(mainTable)}
        SET status = ${JSON.stringify(statusObj)}
        WHERE id = ${doc.id}
      `,
    })
  }

  payload.logger.info({ msg: `Migrated ${documents.rows.length} collection documents` })
}
