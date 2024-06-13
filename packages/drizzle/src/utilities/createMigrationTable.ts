import type { DrizzleAdapter } from '../types.js'

export const createMigrationTable = async (adapter: DrizzleAdapter): Promise<void> => {
  let statement: string

  if (adapter.name === 'sqlite') {
    statement = `
    CREATE TABLE IF NOT EXISTS "payload_migrations"
    (
        "id"         INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        "name"       TEXT,
        "batch"      REAL,
        "updated_at" DATETIME DEFAULT (datetime('now', 'utc')) NOT NULL,
        "created_at" DATETIME DEFAULT (datetime('now', 'utc')) NOT NULL
    );`
  } else if (adapter.name === 'postgres') {
    const prependSchema = adapter.schemaName ? `"${adapter.schemaName}".` : ''
    statement = `
    CREATE TABLE IF NOT EXISTS ${prependSchema}"payload_migrations"
    (
        "id"         serial PRIMARY KEY                        NOT NULL,
        "name"       varchar,
        "batch"      numeric,
        "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
        "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );`
  }

  await adapter.execute({
    drizzle: adapter.drizzle,
    raw: statement,
  })
}
