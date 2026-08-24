import { and, eq, inArray, like, or } from 'drizzle-orm'

import type { DrizzleAdapter, DrizzleTransaction } from '../types.js'

type Args = {
  adapter: DrizzleAdapter
  db: DrizzleAdapter['drizzle'] | DrizzleTransaction
  localeColumnName?: string
  parentColumnName?: string
  parentID: unknown
  pathColumnName?: string
  /**
   * Path prefixes for prefix-based deletions (e.g. from wiped blocks fields).
   * Deletes all rows whose path starts with `${prefix}.`.
   */
  pathPrefixesToDelete?: string[]
  rows: Record<string, unknown>[]
  tableName: string
}

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
  const localizedPathsToDelete = new Set<string>()
  const pathsToDelete = new Set<string>()
  const table = adapter.tables[tableName]

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

  // Delete all rows whose path starts with any of the given prefixes.
  // This cleans up orphaned _rels rows that belong to block positions that were removed:
  // e.g. if `sections` shrinks from 3 to 1, rows at paths `sections.1.faqs`, `sections.2.faqs`
  // are no longer referenced and must be purged using a prefix LIKE query.
  if (pathPrefixesToDelete && pathPrefixesToDelete.length > 0 && pathColumnName) {
    const prefixConditions = pathPrefixesToDelete.map((prefix) =>
      like(table[pathColumnName], `${prefix}.%`),
    )
    const prefixWhere =
      prefixConditions.length === 1 ? prefixConditions[0] : or(...prefixConditions)

    await adapter.deleteWhere({
      db,
      tableName,
      where: and(eq(table[parentColumnName], parentID), prefixWhere),
    })
  }
}
