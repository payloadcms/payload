import type { PostgresAdapter } from '@payloadcms/db-postgres/types'
import type { SQLiteAdapter } from '@payloadcms/db-sqlite/types'
import type { PgTable } from 'drizzle-orm/pg-core'
import type { SQLiteTable } from 'drizzle-orm/sqlite-core'
import type { Payload } from 'payload'

import { sql } from 'drizzle-orm'

import { isMongoose } from '../isMongoose.js'

export const uploadsDirCache: {
  [key: string]: {
    cacheDir: string
    originalDir: string
  }[]
} = {}
export const dbSnapshot = {}

async function createMongooseSnapshot(collectionsObj, snapshotKey: string) {
  const snapshot = {}

  // Assuming `collectionsObj` is an object where keys are names and values are collection references
  for (const collectionName of Object.keys(collectionsObj)) {
    const collection = collectionsObj[collectionName]
    const documents = await collection.find({}).toArray() // Get all documents
    snapshot[collectionName] = documents
  }

  dbSnapshot[snapshotKey] = snapshot // Save the snapshot in memory
}

async function restoreFromMongooseSnapshot(collectionsObj, snapshotKey: string) {
  if (!dbSnapshot[snapshotKey]) {
    throw new Error('No snapshot found to restore from.')
  }

  // Assuming `collectionsObj` is an object where keys are names and values are collection references
  for (const [name, documents] of Object.entries(dbSnapshot[snapshotKey])) {
    const collection = collectionsObj[name]
    // You would typically clear the collection here, but as per your requirement, you do it manually
    if ((documents as any[]).length > 0) {
      await collection.insertMany(documents)
    }
  }
}

async function createDrizzleSnapshot(db: PostgresAdapter | SQLiteAdapter, snapshotKey: string) {
  const snapshot = {}

  const schema: Record<string, PgTable | SQLiteTable> = db.drizzle._.schema
  if (!schema) {
    return
  }

  for (const tableName in schema) {
    const table = db.drizzle.query[tableName]['fullSchema'][tableName] //db.drizzle._.schema[tableName]
    const records = await db.drizzle.select().from(table).execute()
    snapshot[tableName] = records
  }

  dbSnapshot[snapshotKey] = snapshot
}

async function restoreFromDrizzleSnapshot(
  adapter: PostgresAdapter | SQLiteAdapter,
  snapshotKey: string,
) {
  if (!dbSnapshot[snapshotKey]) {
    throw new Error('No snapshot found to restore from.')
  }
  const db = adapter.name === 'postgres' ? (adapter as PostgresAdapter) : (adapter as SQLiteAdapter)
  let disableFKConstraintChecksQuery
  let enableFKConstraintChecksQuery

  if (db.name === 'sqlite') {
    disableFKConstraintChecksQuery = 'PRAGMA foreign_keys = off'
    enableFKConstraintChecksQuery = 'PRAGMA foreign_keys = on'
  }
  if (db.name === 'postgres') {
    disableFKConstraintChecksQuery = 'SET session_replication_role = replica;'
    enableFKConstraintChecksQuery = 'SET session_replication_role = DEFAULT;'
  }

  // Temporarily disable foreign key constraint checks
  try {
    await db.execute({
      drizzle: db.drizzle,
      raw: disableFKConstraintChecksQuery,
    })
    for (const tableName in dbSnapshot[snapshotKey]) {
      const table = db.drizzle.query[tableName]['fullSchema'][tableName]
      await db.execute({
        drizzle: db.drizzle,
        sql: sql`DELETE FROM ${table}`,
      }) // This deletes all records from the table. Probably not necessary, as I'm deleting the table before restoring anyways

      const records = dbSnapshot[snapshotKey][tableName]
      if (records.length > 0) {
        await db.drizzle.insert(table).values(records).execute()
      }
    }
  } catch (e) {
    console.error(e)
  } finally {
    // Re-enable foreign key constraint checks
    await db.execute({
      drizzle: db.drizzle,
      raw: enableFKConstraintChecksQuery,
    })
  }
}

export async function createSnapshot(
  _payload: Payload,
  snapshotKey: string,
  collectionSlugs: string[],
) {
  if (isMongoose(_payload) && 'collections' in _payload.db) {
    const firstCollectionSlug = collectionSlugs?.[0]

    if (!firstCollectionSlug?.length) {
      throw new Error('No collection slugs provided to reset the database.')
    }

    const mongooseCollections = _payload.db.collections[firstCollectionSlug]?.db.collections

    await createMongooseSnapshot(mongooseCollections, snapshotKey)
  } else {
    const db: PostgresAdapter = _payload.db as unknown as PostgresAdapter
    // Only create snapshot if drizzle is available (Postgres/SQLite adapters)
    if (db.drizzle) {
      await createDrizzleSnapshot(db, snapshotKey)
    }
    // For adapters that don't support snapshots (e.g., content-api), we intentionally
    // don't set dbSnapshot[snapshotKey] at all. This is important because:
    // 1. seedDB() checks if dbSnapshot[snapshotKey] exists (line 78)
    // 2. If it exists but is empty {}, seedDB() won't restore BUT also won't create a snapshot
    // 3. By not setting it, subsequent test runs will always do reset + seed (no snapshot caching)
    // 4. This is correct for remote services like Content API where snapshots aren't possible
  }
}

/**
 * Make sure to delete the db before calling this function
 * @param _payload
 */
export async function restoreFromSnapshot(
  _payload: Payload,
  snapshotKey: string,
  collectionSlugs: string[],
) {
  if (isMongoose(_payload) && 'collections' in _payload.db) {
    const mongooseCollections = _payload.db.collections[collectionSlugs[0]].db.collections
    await restoreFromMongooseSnapshot(mongooseCollections, snapshotKey)
  } else {
    const db: PostgresAdapter = _payload.db as unknown as PostgresAdapter
    // Only restore from snapshot if drizzle is available (Postgres/SQLite adapters)
    if (db.drizzle) {
      await restoreFromDrizzleSnapshot(db, snapshotKey)
    } else {
      // Skip restore for other adapters (e.g., content-api)
      // These adapters typically re-seed or handle cleanup differently
    }
  }
}
