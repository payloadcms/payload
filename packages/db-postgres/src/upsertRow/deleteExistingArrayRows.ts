import { and, eq } from 'drizzle-orm';
import { PostgresAdapter } from '../types';

type Args = {
  adapter: PostgresAdapter
  locale?: string
  localeColumnName?: string
  parentColumnName?: string
  parentID: unknown
  pathColumnName?: string
  newRows: Record<string, unknown>[]
  tableName: string
}

export const deleteExistingArrayRows = async ({
  adapter,
  locale,
  parentID,
  tableName,
}: Args): Promise<void> => {
  const table = adapter.tables[tableName];

  const whereConstraints = [
    eq(table._parentID, parentID),
  ];

  // If table has a _locale column,
  // match on only the locale being updated
  if (typeof table._locale !== 'undefined') {
    whereConstraints.push(
      eq(table._locale, locale),
    );
  }

  await adapter.db.delete(table)
    .where(
      and(...whereConstraints),
    );
};
