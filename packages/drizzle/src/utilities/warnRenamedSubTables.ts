import type { DrizzleAdapter } from '../types.js'

/**
 * Warns about array and `hasMany` select tables that were renamed because their name is used by a
 * companion table of their parent. A field added later can cause the rename, which moves an
 * existing table to a new name, so the old table has to be renamed in a migration.
 */
export const warnRenamedSubTables = ({
  adapter,
}: {
  adapter: Pick<DrizzleAdapter, 'payload' | 'subTableNameReplacements'>
}): void => {
  if (!adapter.subTableNameReplacements?.size) {
    return
  }

  const renames = [...adapter.subTableNameReplacements]
    .map(([from, to]) => `${from} -> ${to}`)
    .join(', ')

  adapter.payload.logger.warn(
    `These tables share their name with a table Payload creates for the same collection or global, so they were renamed: ${renames}. If a table already exists under the old name, rename it in a migration to keep its data, or set a dbName on the field to choose another name.`,
  )
}
