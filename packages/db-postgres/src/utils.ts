import { sql } from 'drizzle-orm'

import type { DrizzleDB } from './types'

export const migrationTableExists = async (db: DrizzleDB): Promise<boolean> => {
  const queryRes = await db.execute(sql`SELECT to_regclass('public.payload_migrations');`)

  // Returns table name 'payload_migrations' or null
  const exists = queryRes.rows?.[0]?.to_regclass === 'payload_migrations'
  return exists
}

export const createMigrationTable = async (db: DrizzleDB): Promise<void> => {
  await db.execute(sql`CREATE TABLE IF NOT EXISTS "payload_migrations" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" varchar,
  "batch" numeric,
  "schema" jsonb,
  "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);`)
}
