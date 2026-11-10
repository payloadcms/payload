import type { LibSQLDatabase } from 'drizzle-orm/libsql'

import { and, eq, inArray, sql } from 'drizzle-orm'

import type { DrizzleAdapter, DrizzleTransaction } from '../types.js'

type Args = {
  adapter: DrizzleAdapter
  db: DrizzleAdapter['drizzle'] | DrizzleTransaction
  locales: Record<string, Record<string, unknown>>
  parentID: number | string
  tableName: string
}

/**
 * Writes localized columns like db-mongodb does: a provided field is replaced in every locale,
 * the other fields are left untouched.
 */
export const upsertLocales = async ({
  adapter,
  db,
  locales,
  parentID,
  tableName,
}: Args): Promise<void> => {
  const localesTableName = `${tableName}${adapter.localesSuffix}`
  const localesTable = adapter.tables[localesTableName]
  const columns = [...new Set(Object.values(locales).flatMap((row) => Object.keys(row)))]

  // `undefined` locale values leave empty locale rows, with nothing to write
  if (!columns.length) {
    return
  }

  const nulls = Object.fromEntries(columns.map((column) => [column, null]))

  await adapter.insert({
    db,
    onConflictDoUpdate: {
      set: Object.fromEntries(
        columns.map((column) => [
          column,
          sql`excluded.${sql.identifier(localesTable[column].name)}`,
        ]),
      ),
      target: [localesTable._parentID, localesTable._locale],
    },
    tableName: localesTableName,
    values: Object.entries(locales).map(([locale, row]) => ({
      ...nulls,
      ...row,
      _locale: locale,
      _parentID: parentID,
    })),
  })

  const missingLocales = adapter.payload.config.localization
    ? adapter.payload.config.localization.localeCodes.filter((locale) => !(locale in locales))
    : []

  if (missingLocales.length) {
    await (db as LibSQLDatabase)
      .update(localesTable)
      .set(nulls)
      .where(
        and(eq(localesTable._parentID, parentID), inArray(localesTable._locale, missingLocales)),
      )
  }
}
