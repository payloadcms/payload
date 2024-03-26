import fs from 'fs'
import path from 'path'
import { type Payload } from 'payload'

import { isMongoose } from './isMongoose.js'
import { resetDB } from './reset.js'
import { createSnapshot, dbSnapshot, restoreFromSnapshot } from './snapshot.js'

type SeedFunction = (_payload: Payload) => Promise<void>

export async function seedDB({
  _payload,
  collectionSlugs,
  seedFunction,
  snapshotKey,
  uploadsDir,
}: {
  _payload: Payload
  collectionSlugs: string[]
  seedFunction: SeedFunction
  /**
   * Key to uniquely identify the kind of snapshot. Each test suite should pass in a unique key
   */
  snapshotKey: string
  uploadsDir?: string
}) {
  /**
   * Reset database
   */
  await resetDB(_payload, collectionSlugs)

  /**
   * Mongoose & Postgres: Restore snapshot of old data if available
   *
   * Note for postgres: For postgres, this needs to happen AFTER the tables were created.
   * This does not work if I run payload.db.init or payload.db.connect anywhere. Thus, when resetting the database, we are not dropping the schema, but are instead only deleting the table values
   */
  let restored = false
  if (dbSnapshot[snapshotKey] && Object.keys(dbSnapshot[snapshotKey]).length) {
    await restoreFromSnapshot(_payload, snapshotKey, collectionSlugs)
    restored = true
  }

  /**
   *  Mongoose: Re-create indexes
   *  Postgres: No need for any action here, since we only delete the table data and no schemas
   */
  // Dropping the db breaks indexes (on mongoose - did not test extensively on postgres yet), so we recreate them here
  if (isMongoose(_payload)) {
    await Promise.all([
      ...collectionSlugs.map(async (collectionSlug) => {
        await _payload.db.collections[collectionSlug].createIndexes()
      }),
    ])
  }

  /**
   * If a snapshot was restored, we don't need to seed the database
   */
  if (restored) {
    return
  }

  /**
   * Delete uploads directory only if no snapshot was restored.
   * The snapshot restoration only restores the database state, not the uploads directory.
   * If we ran it after or before restoring the snapshot, we would have NO upload files anymore, as they are not restored from the snapshot. And after snapshot
   * restoration the seed process is not run again
   */
  if (uploadsDir) {
    try {
      // Attempt to clear the uploads directory if it exists
      await fs.promises.access(uploadsDir)
      const files = await fs.promises.readdir(uploadsDir)
      for (const file of files) {
        await fs.promises.rm(path.join(uploadsDir, file))
      }
    } catch (error) {
      if (error.code !== 'ENOENT') {
        // If the error is not because the directory doesn't exist
        console.error('Error in operation:', error)
        throw error
      }
    }
  }

  /**
   * Seed the database with data and save it to a snapshot
   **/
  await seedFunction(_payload)

  await createSnapshot(_payload, snapshotKey, collectionSlugs)
}
