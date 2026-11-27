import type { DrizzleAdapter } from '../types.js'

/**
 * Warns about table names used by two tables, for example two arrays whose names convert to the
 * same snake_case name. Only the later table is kept, so the earlier field can't store its data.
 * These tables are not renamed, because that would change the schema of existing projects.
 */
export const warnSharedTableNames = ({
  adapter,
}: {
  adapter: Pick<DrizzleAdapter, 'payload' | 'sharedTableNames'>
}): void => {
  if (!adapter.sharedTableNames?.size) {
    return
  }

  adapter.payload.logger.warn(
    `These table names are used by more than one field, collection or global, so only the last one keeps its table: ${[...adapter.sharedTableNames].join(', ')}. Set a dbName on one of them to give it its own table.`,
  )
}
