import { and, eq, inArray } from 'drizzle-orm'

import type { DrizzleAdapter, DrizzleTransaction } from '../types.js'

type Args = {
  adapter: DrizzleAdapter
  db: DrizzleAdapter['drizzle'] | DrizzleTransaction
  localeColumnName?: string
  parentColumnName?: string
  parentID: unknown
  pathColumnName?: string
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
}
