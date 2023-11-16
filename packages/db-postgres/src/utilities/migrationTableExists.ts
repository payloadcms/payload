import { sql } from 'drizzle-orm'

import type { DrizzleDB } from '../types'

export const migrationTableExists = async (db: DrizzleDB): Promise<boolean> => {
  const queryRes = await db.execute(sql`SELECT to_regclass('public.payload_migrations');`)

  // Returns table name 'payload_migrations' or null
  const exists = queryRes.rows?.[0]?.to_regclass === 'payload_migrations'
  return exists
}
