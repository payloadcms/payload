import { eq, inArray } from 'drizzle-orm'

import type { BlockPlacement } from '../transform/write/types.js'
import type { DrizzleAdapter, DrizzleTransaction } from '../types.js'

/**
 * Returns the placement a block row's `_path` belongs to: the path without the indexes of the rows it is nested in, so
 * `grid.0.columns.1.content` and `grid.2.columns.0.content` are both `grid.columns.content`.
 */
export const placementPath = (path: string): string =>
  path
    .split('.')
    .filter((segment) => segment !== '' && !/^\d+$/.test(segment))
    .join('.')

/**
 * Returns the tables of the adapter that are variants of a block's table: the plain name and its numbered variants.
 */
const getBlockTableVariants = (adapter: DrizzleAdapter, baseBlockTableName: string): string[] => {
  const prefix = `${baseBlockTableName}_`

  return Object.keys(adapter.tables).filter(
    (tableName) =>
      tableName === baseBlockTableName ||
      (tableName.startsWith(prefix) && /^\d+$/.test(tableName.slice(prefix.length))),
  )
}

type Args = {
  adapter: DrizzleAdapter
  /** The placements the write rewrote */
  blockPlacements: BlockPlacement[]
  /** The block tables the write has already cleared of the document's rows */
  blocksToDelete: Set<string>
  db: DrizzleAdapter['drizzle'] | DrizzleTransaction
  parentID: unknown
}

/**
 * Deletes a document's block rows that sit in another variant table of their block than the one their placement maps
 * to.
 *
 * A block that differs between the fields offering it gets a table per placement, numbered in the order the config
 * walks them. When a placement is added, removed or reordered earlier in that walk, every later placement is
 * renumbered and its rows already stored stay under the old number. Reads still find them, since rows are merged from
 * every variant by `_path`, but an update only clears and rewrites the tables the placements map to now, so the stale
 * row is written a second time into the new table and the document reads back with the block twice.
 *
 * So before an update writes its blocks, the rows of each placement it rewrites are cleared from the block's other
 * variants as well. Only placements the update rewrites are touched: their rows are written again from the incoming
 * data, which reads included the stale rows in.
 */
export const deleteStaleBlockVariantRows = async ({
  adapter,
  blockPlacements,
  blocksToDelete,
  db,
  parentID,
}: Args): Promise<void> => {
  const pathsByBaseTable = new Map<string, Set<string>>()

  for (const { baseBlockTableName, path } of blockPlacements) {
    // A block only gets numbered variants when a placement's table differs from the others
    if (!baseBlockTableName) {
      continue
    }

    const paths = pathsByBaseTable.get(baseBlockTableName) ?? new Set<string>()
    paths.add(path)
    pathsByBaseTable.set(baseBlockTableName, paths)
  }

  for (const [baseBlockTableName, paths] of pathsByBaseTable) {
    for (const tableName of getBlockTableVariants(adapter, baseBlockTableName)) {
      // Cleared of every row of the document already
      if (blocksToDelete.has(tableName)) {
        continue
      }

      const table = adapter.tables[tableName]

      const rows: { _path: string; id: number | string }[] = await (db as any)
        .select({ id: table.id, _path: table._path })
        .from(table)
        .where(eq(table._parentID, parentID))

      const staleIDs = rows.filter((row) => paths.has(placementPath(row._path))).map(({ id }) => id)

      if (staleIDs.length > 0) {
        await adapter.deleteWhere({
          db,
          tableName,
          where: inArray(table.id, staleIDs),
        })
      }
    }
  }
}
