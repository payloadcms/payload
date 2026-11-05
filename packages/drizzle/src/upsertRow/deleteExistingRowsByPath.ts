import { and, eq, inArray, or, sql } from 'drizzle-orm'

import type { DrizzleAdapter, DrizzleTransaction } from '../types.js'

type Args = {
  adapter: DrizzleAdapter
  db: DrizzleAdapter['drizzle'] | DrizzleTransaction
  localeColumnName?: string
  parentColumnName?: string
  parentID: unknown
  pathColumnName?: string
  /**
   * Paths beginning with any of these prefixes are deleted, on top of the exact paths collected
   * from `rows`. Used to clear rows left at array indexes the incoming data no longer occupies.
   */
  pathPrefixesToDelete?: Set<string>
  rows: Record<string, unknown>[]
  tableName: string
}

/**
 * `_` and `%` are `LIKE` wildcards, and both are legal characters in a Payload field name, so they
 * have to be escaped to keep a prefix from matching sibling paths.
 */
const escapeLikePattern = (value: string): string => value.replace(/[\\%_]/g, '\\$&')

export const deleteExistingRowsByPath = async ({
  adapter,
  db,
  localeColumnName = '_locale',
  parentColumnName = '_parentID',
  parentID,
  pathColumnName = '_path',
  pathPrefixesToDelete,
  rows,
  tableName,
}: Args): Promise<void> => {
  const table = adapter.tables[tableName]

  // `_texts` / `_numbers` tables only exist when the schema has a hasMany text/number field
  if (!table) {
    return
  }

  const localizedPathsToDelete = new Set<string>()
  const pathsToDelete = new Set<string>()

  rows.forEach((row) => {
    const path = row[pathColumnName]
    const localeData = row[localeColumnName]
    if (typeof path === 'string') {
      if (typeof localeData === 'string') {
        localizedPathsToDelete.add(path)
      } else {
        pathsToDelete.add(path)
      }
    }
  })

  // Deleted without a locale constraint on purpose - the array rows these belong to are themselves
  // wiped for every locale by `deleteExistingArrayRows` and re-inserted from the incoming data.
  if (pathPrefixesToDelete && pathPrefixesToDelete.size > 0) {
    const prefixConstraints = Array.from(
      pathPrefixesToDelete,
      (prefix) => sql`${table[pathColumnName]} like ${`${escapeLikePattern(prefix)}%`} escape '\\'`,
    )

    await adapter.deleteWhere({
      db,
      tableName,
      where: and(eq(table[parentColumnName], parentID), or(...prefixConstraints)),
    })
  }

  if (localizedPathsToDelete.size > 0) {
    const whereConstraints = [eq(table[parentColumnName], parentID)]

    if (pathColumnName) {
      whereConstraints.push(inArray(table[pathColumnName], Array.from(localizedPathsToDelete)))
    }

    await adapter.deleteWhere({
      db,
      tableName,
      where: and(...whereConstraints),
    })
  }

  if (pathsToDelete.size > 0) {
    const whereConstraints = [eq(table[parentColumnName], parentID)]

    if (pathColumnName) {
      whereConstraints.push(inArray(table[pathColumnName], Array.from(pathsToDelete)))
    }

    await adapter.deleteWhere({
      db,
      tableName,
      where: and(...whereConstraints),
    })
  }
}
