import type { PostgresAdapter } from '@payloadcms/db-postgres/types'
import type { SQLiteAdapter } from '@payloadcms/db-sqlite/types'
import type { PgTable } from 'drizzle-orm/pg-core'
import type { SQLiteTable } from 'drizzle-orm/sqlite-core'
import type { Payload } from 'payload'

import { GenericTable } from '@payloadcms/drizzle/types'
import { sql } from 'drizzle-orm'

import { isMongoose } from './isMongoose.js'

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
    const mongooseCollections = _payload.db.collections[collectionSlugs[0]].db.collections

    await createMongooseSnapshot(mongooseCollections, snapshotKey)
  } else {
    const db: PostgresAdapter = _payload.db as unknown as PostgresAdapter
    await createDrizzleSnapshot(db, snapshotKey)
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
    await restoreFromDrizzleSnapshot(db, snapshotKey)
  }
}
