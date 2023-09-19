import { and, eq } from 'drizzle-orm'

import type { PostgresAdapter } from '../types'

type Args = {
  adapter: PostgresAdapter
  parentID: unknown

  tableName: string
}

export const deleteExistingArrayRows = async ({
  adapter,
  parentID,
  tableName,
}: Args): Promise<void> => {
  const table = adapter.tables[tableName]

  const whereConstraints = [eq(table._parentID, parentID)]

  await adapter.db.delete(table).where(and(...whereConstraints))
}
