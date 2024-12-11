import fs from 'fs'
import * as os from 'node:os'
import path from 'path'
import { type Payload } from 'payload'

import { isMongoose } from './isMongoose.js'
import { resetDB } from './reset.js'
import { createSnapshot, dbSnapshot, restoreFromSnapshot, uploadsDirCache } from './snapshot.js'

type SeedFunction = (_payload: Payload) => Promise<void> | void

export async function seedDB({
  _payload,
  collectionSlugs,
  seedFunction,
  snapshotKey,
  uploadsDir,
  /**
   * Always seeds, instead of restoring from snapshot for consecutive test runs
   */
  alwaysSeed = false,
  deleteOnly,
}: {
  _payload: Payload
  alwaysSeed?: boolean
  collectionSlugs: string[]
  deleteOnly?: boolean
  seedFunction: SeedFunction
  /**
   * Key to uniquely identify the kind of snapshot. Each test suite should pass in a unique key
   */
  snapshotKey: string
  uploadsDir?: string | string[]
}) {
  /**
   * Reset database
   */
  await resetDB(_payload, collectionSlugs)
  /**
   * Delete uploads directory if it exists
   */
  if (uploadsDir) {
    const uploadsDirs = Array.isArray(uploadsDir) ? uploadsDir : [uploadsDir]
    for (const dir of uploadsDirs) {
      try {
        // Attempt to clear the uploads directory if it exists
        await fs.promises.access(dir)
        const files = await fs.promises.readdir(dir)
        for (const file of files) {
          await fs.promises.rm(path.join(dir, file))
        }
      } catch (error) {
        if (error.code !== 'ENOENT') {
          // If the error is not because the directory doesn't exist
          console.error('Error in operation (deleting uploads dir):', dir, error)
          throw error
        }
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
  if (
    !alwaysSeed &&
    dbSnapshot[snapshotKey] &&
    Object.keys(dbSnapshot[snapshotKey]).length &&
    !deleteOnly
  ) {
    await restoreFromSnapshot(_payload, snapshotKey, collectionSlugs)

    /**
     * Restore uploads dir if it exists
     */
    if (uploadsDirCache[snapshotKey]) {
      for (const cache of uploadsDirCache[snapshotKey]) {
        if (cache.originalDir && fs.existsSync(cache.cacheDir)) {
          // move all files from inside uploadsDirCacheFolder to uploadsDir
          await fs.promises
            .readdir(cache.cacheDir, { withFileTypes: true })
            .then(async (files) => {
              for (const file of files) {
                if (file.isDirectory()) {
                  await fs.promises.mkdir(path.join(cache.originalDir, file.name), {
                    recursive: true,
                  })
                  await fs.promises.copyFile(
                    path.join(cache.cacheDir, file.name),
                    path.join(cache.originalDir, file.name),
                  )
                } else {
                  await fs.promises.copyFile(
                    path.join(cache.cacheDir, file.name),
                    path.join(cache.originalDir, file.name),
                  )
                }
              }
            })
            .catch((err) => {
              console.error('Error in operation (restoring uploads dir):', err)
              throw err
            })
        }
      }
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
        await _payload.db.collections[collectionSlug].createIndexes()
      }),
    ])

    await Promise.all(
      _payload.config.collections.map(async (coll) => {
        await _payload.db?.collections[coll.slug]?.ensureIndexes()
      }),
    )
  }

  /**
   * If a snapshot was restored, we don't need to seed the database
   */
  if (restored || deleteOnly) {
    return
  }

  /**
   * Seed the database with data and save it to a snapshot
   **/
  if (typeof seedFunction === 'function') {
    await seedFunction(_payload)
  }

  if (!alwaysSeed) {
    await createSnapshot(_payload, snapshotKey, collectionSlugs)
  }

  /**
   * Cache uploads dir to a cache folder if uploadsDir exists
   */
  if (!alwaysSeed && uploadsDir) {
    const uploadsDirs = Array.isArray(uploadsDir) ? uploadsDir : [uploadsDir]
    for (const dir of uploadsDirs) {
      if (dir && fs.existsSync(dir)) {
        if (!uploadsDirCache[snapshotKey]) {
          uploadsDirCache[snapshotKey] = []
        }
        let newObj: {
          cacheDir: string
          originalDir: string
        } = null
        if (!uploadsDirCache[snapshotKey].find((cache) => cache.originalDir === dir)) {
          // Define new cache folder path to the OS temp directory (well a random folder inside it)
          newObj = {
            originalDir: dir,
            cacheDir: path.join(os.tmpdir(), `${snapshotKey}`, `payload-e2e-tests-uploads-cache`),
          }
        }
        if (!newObj) {
          continue
        }

        // delete the cache folder if it exists
        if (fs.existsSync(newObj.cacheDir)) {
          await fs.promises.rm(newObj.cacheDir, { recursive: true })
        }
        await fs.promises.mkdir(newObj.cacheDir, { recursive: true })
        // recursively move all files and directories from uploadsDir to uploadsDirCacheFolder

        try {
          const files = await fs.promises.readdir(newObj.originalDir, { withFileTypes: true })

          for (const file of files) {
            if (file.isDirectory()) {
              await fs.promises.mkdir(path.join(newObj.cacheDir, file.name), {
                recursive: true,
              })
              await fs.promises.copyFile(
                path.join(newObj.originalDir, file.name),
                path.join(newObj.cacheDir, file.name),
              )
            } else {
              await fs.promises.copyFile(
                path.join(newObj.originalDir, file.name),
                path.join(newObj.cacheDir, file.name),
              )
            }
          }

          uploadsDirCache[snapshotKey].push(newObj)
        } catch (e) {
          console.error('Error in operation (creating snapshot of uploads dir):', e)
          throw e
        }
      }
    }
  }
}
