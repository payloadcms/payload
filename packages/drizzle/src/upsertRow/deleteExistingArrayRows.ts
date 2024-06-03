import { and, eq } from 'drizzle-orm'

import type { DrizzleAdapter, DrizzleTransaction } from '../types.js'

type Args = {
  adapter: DrizzleAdapter
  db: DrizzleTransaction
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
