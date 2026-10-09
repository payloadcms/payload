import type { ReleaseMigrationLock, TryAcquireMigrationLock } from 'payload'

import { and, eq, isNull, lte, or, sql } from 'drizzle-orm'

import type { DrizzleAdapter, PostgresDB } from './types.js'

import { getPrimaryDb } from './utilities/getPrimaryDb.js'
import { migrationLockRetry } from './utilities/migrationLockRetry.js'
import { markWrite } from './utilities/readAfterWrite.js'

const lockSlug = 'payload-migrations-lock'

export const tryAcquireMigrationLock: TryAcquireMigrationLock = async function (
  this: DrizzleAdapter,
  { instanceId, timeout },
) {
  const { db, table } = getLockStorage({ adapter: this })
  const isSQLite = this.name === 'sqlite'
  const now = isSQLite ? sql`strftime('%Y-%m-%dT%H:%M:%fZ', 'now')` : sql`clock_timestamp()`
  const expiresAt = isSQLite
    ? sql`strftime('%Y-%m-%dT%H:%M:%fZ', 'now', ${`${timeout / 1000} seconds`})`
    : sql`clock_timestamp() + ${timeout} * interval '1 millisecond'`

  // The unique key serializes concurrent first use, independently of generated ID types.
  await migrationLockRetry({
    isSQLite,
    operation: async () => {
      await db
        .insert(table)
        .values({ createdAt: now, lock_key: lockSlug, locked: false, updatedAt: now })
        .onConflictDoNothing({ target: table.lock_key })
    },
  })

  const result = await migrationLockRetry({
    isSQLite,
    operation: async () =>
      db
        .update(table)
        .set({
          expires_at: expiresAt,
          locked: true,
          locked_at: now,
          locked_by: instanceId,
          updatedAt: now,
        })
        .where(
          and(
            eq(table.lock_key, lockSlug),
            or(eq(table.locked, false), isNull(table.locked), lte(table.expires_at, now)),
          ),
        )
        .returning({ id: table.id }),
  })

  markWrite(this)

  return { acquired: result.length === 1 }
}

export const releaseMigrationLock: ReleaseMigrationLock = async function (
  this: DrizzleAdapter,
  { instanceId },
) {
  const { db, table } = getLockStorage({ adapter: this })

  await migrationLockRetry({
    isSQLite: this.name === 'sqlite',
    operation: async () => {
      await db
        .update(table)
        .set({ locked: false })
        .where(and(eq(table.lock_key, lockSlug), eq(table.locked_by, instanceId)))
    },
  })

  markWrite(this)
}

function getLockStorage({ adapter }: { adapter: DrizzleAdapter }) {
  const tableName = adapter.tableNameMap.get('payload_migrations_lock')
  const table = tableName && adapter.tables[tableName]

  if (!table?.lock_key) {
    throw new Error('Migration lock schema is unavailable. Bootstrap it with migrate --skip-lock.')
  }

  // Both dialects expose the same insert/update builder operations used here.
  const db = getPrimaryDb(adapter, adapter.drizzle) as PostgresDB

  return { db, table }
}
