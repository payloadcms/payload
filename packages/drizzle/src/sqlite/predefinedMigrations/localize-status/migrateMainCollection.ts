import type { Payload } from 'payload'

import { sql } from 'drizzle-orm'
import toSnakeCase from 'to-snake-case'

/**
 * Migrates main collection documents from _status to per-locale status object
 */
export async function migrateMainCollectionStatus({
  collectionSlug,
  db,
  locales,
  payload,
  versionsTable,
}: {
  collectionSlug: string
  db: any
  locales: string[]
  payload: Payload
  versionsTable: string
}): Promise<void> {
  const mainTable = toSnakeCase(collectionSlug)
  const mainLocalesTable = `${mainTable}_locales`

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
