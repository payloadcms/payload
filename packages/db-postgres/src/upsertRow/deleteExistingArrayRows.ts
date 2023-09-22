import { and, eq } from 'drizzle-orm'

import type { DrizzleDB, PostgresAdapter } from '../types'

type Args = {
  adapter: PostgresAdapter
  db: DrizzleDB
  parentID: unknown
  tableName: string
}

export const deleteExistingArrayRows = async ({
  adapter,
  db,
  parentID,
  tableName,
}: Args): Promise<void> => {
  const table = adapter.tables[tableName]

  const whereConstraints = [eq(table._parentID, parentID)]

  await db.delete(table).where(and(...whereConstraints))
}
