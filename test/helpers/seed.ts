import fs from 'fs'
import * as os from 'node:os'
import path from 'path'
import { type Payload } from 'payload'

import { isMongoose } from './isMongoose.js'
import { resetDB } from './reset.js'
import { createSnapshot, dbSnapshot, restoreFromSnapshot, uploadsDirCache } from './snapshot.js'

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
   * Delete uploads directory if it exists
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
        console.error('Error in operation (deleting uploads dir):', error)
        throw error
      }
    }
  }

  /**
   * Mongoose & Postgres: Restore snapshot of old data if available
   *
   * Note for postgres: For postgres, this needs to happen AFTER the tables were created.
   * This does not work if I run payload.db.init or payload.db.connect anywhere. Thus, when resetting the database, we are not dropping the schema, but are instead only deleting the table values
   */
  let restored = false
  if (dbSnapshot[snapshotKey] && Object.keys(dbSnapshot[snapshotKey]).length) {
    await restoreFromSnapshot(_payload, snapshotKey, collectionSlugs)

    /**
     * Restore uploads dir if it exists
     */
    if (uploadsDir && fs.existsSync(uploadsDirCacheFolder)) {
      // move all files from inside uploadsDirCacheFolder to uploadsDir
      await fs.promises
        .readdir(uploadsDirCacheFolder, { withFileTypes: true })
        .then(async (files) => {
          for (const file of files) {
            if (file.isDirectory()) {
              await fs.promises.mkdir(path.join(uploadsDir, file.name), {
                recursive: true,
              })
              await fs.promises.copyFile(
                path.join(uploadsDirCacheFolder, file.name),
                path.join(uploadsDir, file.name),
              )
            } else {
              await fs.promises.copyFile(
                path.join(uploadsDirCacheFolder, file.name),
                path.join(uploadsDir, file.name),
              )
            }
          }
        })
        .catch((err) => {
          console.error('Error in operation (restoring uploads dir):', err)
          throw err
        })
    }

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
        // @ts-expect-error TODO: Type this better
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

  /**
   * Cache uploads dir to a cache folder if uploadsDir exists
   */
  if (uploadsDir && fs.existsSync(uploadsDir)) {
    if (!uploadsDirCache.path) {
      // Define new cache folder path to the OS temp directory (well a random folder inside it)
      uploadsDirCache.path = path.join(os.tmpdir(), `payload-e2e-tests-uploads-cache`)
    }

    // delete the cache folder if it exists
    if (fs.existsSync(uploadsDirCache.path)) {
      await fs.promises.rm(uploadsDirCache.path, { recursive: true })
    }
    await fs.promises.mkdir(uploadsDirCache.path, { recursive: true })
    // recursively move all files and directories from uploadsDir to uploadsDirCacheFolder
    await fs.promises
      .readdir(uploadsDir, { withFileTypes: true })
      .then(async (files) => {
        for (const file of files) {
          if (file.isDirectory()) {
            await fs.promises.mkdir(path.join(uploadsDirCache.path, file.name), {
              recursive: true,
            })
            await fs.promises.copyFile(
              path.join(uploadsDir, file.name),
              path.join(uploadsDirCache.path, file.name),
            )
          } else {
            await fs.promises.copyFile(
              path.join(uploadsDir, file.name),
              path.join(uploadsDirCache.path, file.name),
            )
          }
        }
      })
      .catch((err) => {
        console.error('Error in operation (creating snapshot of uploads dir):', err)
        throw err
      })
  }
}
