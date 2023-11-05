import type { PgTable } from 'drizzle-orm/pg-core'

import { sql } from 'drizzle-orm'

import type { PostgresAdapter } from '../../packages/db-postgres/src/types'
import type { Payload } from '../../packages/payload/src'

import { isMongoose } from './isMongoose'

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

async function createDrizzleSnapshot(db: PostgresAdapter, snapshotKey: string) {
  const snapshot = {}

  const schema: Record<string, PgTable> = db.drizzle._.schema
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

async function restoreFromDrizzleSnapshot(db: PostgresAdapter, snapshotKey: string) {
  if (!dbSnapshot[snapshotKey]) {
    throw new Error('No snapshot found to restore from.')
  }

  const disableFKConstraintChecksQuery = sql.raw('SET session_replication_role = replica;')
  const enableFKConstraintChecksQuery = sql.raw('SET session_replication_role = DEFAULT;')

  await db.drizzle.transaction(async (trx) => {
    // Temporarily disable foreign key constraint checks
    await trx.execute(disableFKConstraintChecksQuery)
    try {
      for (const tableName in dbSnapshot[snapshotKey]) {
        const table = db.drizzle.query[tableName]['fullSchema'][tableName]
        await trx.delete(table).execute() // This deletes all records from the table. Probably not necessary, as I'm deleting the table before restoring anyways

        const records = dbSnapshot[snapshotKey][tableName]
        if (records.length > 0) {
          await trx.insert(table).values(records).execute()
        }
      }
    } catch (e) {
      console.error(e)
    } finally {
      // Re-enable foreign key constraint checks
      await trx.execute(enableFKConstraintChecksQuery)
    }
  })
}

export async function createSnapshot(
  _payload: Payload,
  snapshotKey: string,
  collectionSlugs: string[],
) {
  if (isMongoose(_payload)) {
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
  if (isMongoose(_payload)) {
    const mongooseCollections = _payload.db.collections[collectionSlugs[0]].db.collections
    await restoreFromMongooseSnapshot(mongooseCollections, snapshotKey)
  } else {
    const db: PostgresAdapter = _payload.db as unknown as PostgresAdapter
    await restoreFromDrizzleSnapshot(db, snapshotKey)
  }
}
