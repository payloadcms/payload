import { and, eq, inArray } from 'drizzle-orm';
import { PostgresAdapter } from '../types';

type Args = {
  adapter: PostgresAdapter
  locale?: string
  localeColumnName?: string
  parentColumnName?: string
  parentID: unknown
  pathColumnName?: string
  rows: Record<string, unknown>[]
  tableName: string
}

// TODO: Locale is not on block or array rows
// need to only delete locale rows / recreate them if applicable
// not sure what to do here yet... Arrays are helpful to see this in action

export const deleteChildRows = async ({
  adapter,
  locale,
  localeColumnName = '_locale',
  parentColumnName = '_parentID',
  parentID,
  pathColumnName,
  rows,
  tableName,
}: Args): Promise<void> => {
  const localizedPathsToDelete = new Set<string>();
  const pathsToDelete = new Set<string>();

  rows.forEach((row) => {
    const path = row[pathColumnName];
    const localeData = row[localeColumnName];
    if (typeof path === 'string') {
      if (typeof localeData === 'string') {
        localizedPathsToDelete.add(path);
      } else {
        pathsToDelete.add(path);
      }
    }
  });

  if (localizedPathsToDelete.size > 0 && locale) {
    const whereConstraints = [
      eq(adapter.tables[tableName][parentColumnName], parentID),
      eq(adapter.tables[tableName][localeColumnName], locale),
    ];

    if (pathColumnName) whereConstraints.push(inArray(adapter.tables[tableName][pathColumnName], [localizedPathsToDelete]));

    await adapter.db.delete(adapter.tables[tableName])
      .where(
        and(...whereConstraints),
      );
  }

  if (pathsToDelete.size > 0) {
    const whereConstraints = [
      eq(adapter.tables[tableName][parentColumnName], parentID),
    ];

    if (pathColumnName) whereConstraints.push(inArray(adapter.tables[tableName][pathColumnName], [pathsToDelete]));

    await adapter.db.delete(adapter.tables[tableName])
      .where(
        and(...whereConstraints),
      );
  }
};
