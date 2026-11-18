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
    .map(
      ([from, to]) =>
        `${getOriginalTableName({ name: from, replacements: adapter.subTableNameReplacements })} -> ${to}`,
    )
    .join(', ')

  adapter.payload.logger.warn(
    `These tables share their name with a table Payload creates for the same collection or global, so they were renamed: ${renames}. Tables nested in them, including their _locales tables, are renamed the same way. If these tables already exist, rename them in a migration to keep their data. Setting a dbName on the field chooses the new name but does not move existing rows.`,
  )
}

/**
 * A nested table can clash only after its parent was renamed, so the name it was replaced from
 * includes the parent's new name. Returns the name the table had before any rename, which is the
 * name it has in an existing database.
 */
const getOriginalTableName = ({
  name,
  replacements,
}: {
  name: string
  replacements: Map<string, string>
}): string => {
  for (const [from, to] of replacements) {
    if (name.startsWith(`${to}_`)) {
      return getOriginalTableName({ name: `${from}${name.slice(to.length)}`, replacements })
    }
  }

  return name
}
