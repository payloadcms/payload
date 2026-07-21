import type { DrizzleAdapter } from '../../../types.js'

type LocalizeStatusArgs = {
  collectionSlug?: string
  db: unknown
  globalSlug?: string
  payload: unknown
  req?: unknown
}

/**
 * Moves the `_status` field from version tables into per-locale `_locales` tables.
 *
 * @todo Not yet implemented for the SQL Server adapter. The SQLite/Postgres implementations rely
 * on dialect-specific raw SQL (`pragma_table_info`, `sqlite_master`, `RETURNING`, etc.) that needs
 * a full SQL Server rewrite (`sys.columns`, `OUTPUT`, identity handling).
 */
// eslint-disable-next-line
export const migrateMssqlLocalizeStatus = async (_args: LocalizeStatusArgs): Promise<void> => {
  throw new Error(
    'The localize-status predefined migration is not yet supported by @payloadcms/db-mssql.',
  )
}

export type { DrizzleAdapter, LocalizeStatusArgs }
