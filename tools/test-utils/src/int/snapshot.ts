import type { Payload } from 'payload'

import { sql } from 'drizzle-orm'

import { isMongoose } from './isMongoose.js'

type DrizzleDb = {
  drizzle: {
    _: { schema: Record<string, unknown> | undefined }
    insert: (table: unknown) => { values: (records: unknown[]) => { execute: () => Promise<void> } }
    query: Record<string, { fullSchema: Record<string, unknown> }>
    select: () => { from: (table: unknown) => { execute: () => Promise<unknown[]> } }
  }
  execute: (args: { drizzle: unknown; raw?: string; sql?: unknown }) => Promise<unknown>
  name: 'postgres' | 'sqlite'
}

export const uploadsDirCache: {
  [key: string]: {
    cacheDir: string
    originalDir: string
  }[]
} = {}
export const dbSnapshot: Record<string, Record<string, unknown[]>> = {}

async function createMongooseSnapshot(collectionsObj: any, snapshotKey: string) {
  const snapshot: Record<string, unknown[]> = {}

  // Assuming `collectionsObj` is an object where keys are names and values are collection references
  for (const collectionName of Object.keys(collectionsObj)) {
    const collection = collectionsObj[collectionName]
    const documents = await collection.find({}).toArray() // Get all documents
    snapshot[collectionName] = documents
  }

  dbSnapshot[snapshotKey] = snapshot // Save the snapshot in memory
}

async function restoreFromMongooseSnapshot(collectionsObj: any, snapshotKey: string) {
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

async function createDrizzleSnapshot(db: DrizzleDb, snapshotKey: string) {
  const snapshot: Record<string, unknown[]> = {}

  const schema = db.drizzle._.schema
  if (!schema) {
    return
  }

  for (const tableName in schema) {
    const table = db.drizzle.query[tableName]['fullSchema'][tableName]
    const records = await db.drizzle.select().from(table).execute()
    snapshot[tableName] = records
  }

  dbSnapshot[snapshotKey] = snapshot
}

async function restoreFromDrizzleSnapshot(db: DrizzleDb, snapshotKey: string) {
  if (!dbSnapshot[snapshotKey]) {
    throw new Error('No snapshot found to restore from.')
  }

  let disableFKConstraintChecksQuery: string | undefined
  let enableFKConstraintChecksQuery: string | undefined

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

    const mongooseCollections = (_payload.db as any).collections[firstCollectionSlug]?.db
      .collections

    await createMongooseSnapshot(mongooseCollections, snapshotKey)
  } else {
    const db = _payload.db as unknown as DrizzleDb
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
    const mongooseCollections = (_payload.db as any).collections[collectionSlugs[0]].db.collections
    await restoreFromMongooseSnapshot(mongooseCollections, snapshotKey)
  } else {
    const db = _payload.db as unknown as DrizzleDb
    await restoreFromDrizzleSnapshot(db, snapshotKey)
  }
}
