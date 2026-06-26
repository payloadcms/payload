import type { Payload } from 'payload'

import { sql } from 'drizzle-orm'
import toSnakeCase from 'to-snake-case'

/**
 * Migrates main global document from _status to per-locale status object
 */
export async function migrateMainGlobalStatus({
  db,
  globalSlug,
  locales,
  payload,
  versionsTable,
}: {
  db: any
  globalSlug: string
  locales: string[]
  payload: Payload
  versionsTable: string
}): Promise<void> {
  const globalTable = toSnakeCase(globalSlug)
  const globalLocalesTable = `${globalTable}_locales`

  payload.logger.info({ msg: `Migrating main global locales for: ${globalLocalesTable}` })

  const globalDoc: any = await db.get(sql.raw(`SELECT id FROM "${globalTable}" LIMIT 1`))

  if (!globalDoc) {
    payload.logger.warn({ msg: `No global document found for ${globalSlug}, skipping` })
    return
  }

  for (const locale of locales) {
    const latestVersionRows: any[] = await db.all(
      sql.raw(
        `SELECT l.version__status as _status FROM "${versionsTable}" v JOIN "${versionsTable}_locales" l ON l._parent_id = v.id WHERE l._locale = '${locale}' ORDER BY v.created_at DESC LIMIT 1`,
      ),
    )

    const status = latestVersionRows[0]?._status || 'draft'

    await db.run(
      sql.raw(
        `UPDATE "${globalLocalesTable}" SET _status = '${status}' WHERE _parent_id = ${globalDoc.id} AND _locale = '${locale}'`,
      ),
    )
  }

  payload.logger.info({ msg: 'Migrated global document' })
}
