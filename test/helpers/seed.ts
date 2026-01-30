import fs from 'fs'
import path from 'path'
import { type Payload } from 'payload'

import { isErrorWithCode } from './isErrorWithCode.js'
import { resetDB } from './reset.js'

type SeedFunction = (_payload: Payload) => Promise<void> | void

export async function seedDB({
  _payload,
  collectionSlugs,
  seedFunction,
  uploadsDir,
  deleteOnly,
}: {
  _payload: Payload
  collectionSlugs: string[]
  deleteOnly?: boolean
  seedFunction: SeedFunction
  uploadsDir?: string | string[]
}) {
  /**
   * Reset database
   */
  try {
    await resetDB(_payload, collectionSlugs)
  } catch (error) {
    console.error('Error in operation (resetting database):', error)
  }
  /**
   * Delete uploads directory if it exists
   */
  if (uploadsDir) {
    const uploadsDirs = Array.isArray(uploadsDir) ? uploadsDir : [uploadsDir]
    for (const dir of uploadsDirs) {
      try {
        await fs.promises.access(dir)
        const files = await fs.promises.readdir(dir)
        for (const file of files) {
          const filePath = path.join(dir, file)
          await fs.promises.rm(filePath, { force: true, recursive: true })
        }
      } catch (error) {
        if (isErrorWithCode(error, 'ENOENT')) {
          // Directory does not exist - that's okay, skip it
          continue
        } else {
          // Some other error occurred - rethrow it
          console.error('Error in operation (deleting uploads dir):', dir, error)
          throw error
        }
      }
    }
  }

  /**
   * If deleteOnly is set, we don't seed the database
   */
  if (deleteOnly) {
    return
  }

  /**
   * Seed the database with data
   */
  if (typeof seedFunction === 'function') {
    await seedFunction(_payload)
  }
}
