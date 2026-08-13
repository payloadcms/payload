import { and, eq, inArray, like, or } from 'drizzle-orm'

import type { DrizzleAdapter, DrizzleTransaction } from '../types.js'

type Args = {
  adapter: DrizzleAdapter
  db: DrizzleAdapter['drizzle'] | DrizzleTransaction
  parentColumnName?: string
  parentID: unknown
  pathColumnName?: string
  /**
   * Prefixes of paths to delete in full, ex: `myBlocks.` deletes `myBlocks.0.myRelationship`
   * as well as `myBlocks.1.myRelationship`. Used for array / blocks fields that are being
   * replaced in full, whose rows would otherwise survive at indexes the field no longer has.
   */
  pathPrefixes?: Iterable<string>
  rows: Record<string, unknown>[]
  tableName: string
}

export const deleteExistingRowsByPath = async ({
  adapter,
  db,
  parentColumnName = '_parentID',
  parentID,
  pathColumnName = '_path',
  pathPrefixes = [],
  rows,
  tableName,
}: Args): Promise<void> => {
  const table = adapter.tables[tableName]

  // The `_rels` / `_texts` / `_numbers` tables only exist when the collection declares a field
  // that writes to them.
  if (!table) {
    return
  }

  const pathsToDelete = new Set<string>()

  rows.forEach((row) => {
    const path = row[pathColumnName]

    if (typeof path === 'string') {
      pathsToDelete.add(path)
    }
  })

  const pathConstraints = []

  if (pathsToDelete.size > 0) {
    pathConstraints.push(inArray(table[pathColumnName], Array.from(pathsToDelete)))
  }

  for (const prefix of pathPrefixes) {
    pathConstraints.push(like(table[pathColumnName], `${prefix}%`))
  }

  if (pathConstraints.length === 0) {
    return
  }

  await adapter.deleteWhere({
    db,
    tableName,
    where: and(eq(table[parentColumnName], parentID), or(...pathConstraints)),
  })
}
