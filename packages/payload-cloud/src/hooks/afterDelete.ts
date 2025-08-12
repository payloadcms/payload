import type { CollectionAfterDeleteHook, CollectionConfig, FileData, TypeWithID } from 'payload'

import type { TypeWithPrefix } from '../types.js'

import { createKey } from '../utilities/createKey.js'
import { getStorageClient } from '../utilities/getStorageClient.js'

interface Args {
  collection: CollectionConfig
}

export const getAfterDeleteHook = ({
  collection,
}: Args): CollectionAfterDeleteHook<FileData & TypeWithID & TypeWithPrefix> => {
  return async ({ doc, req }) => {
    try {
      const { identityID, storageClient } = await getStorageClient()

      const filesToDelete: string[] = [
        doc.filename || '',
        ...Object.values(doc?.sizes || [])
          .map((resizedFileData) => resizedFileData.filename)
          .filter((filename): filename is string => filename !== null),
      ]

      const promises = filesToDelete.map(async (filename) => {
        await storageClient.deleteObject({
          Bucket: process.env.PAYLOAD_CLOUD_BUCKET,
          Key: createKey({ collection: collection.slug, filename, identityID }),
        })
      })

      await Promise.all(promises)
    } catch (err: unknown) {
      req.payload.logger.error(
        `There was an error while deleting files corresponding to the ${collection.labels?.singular} with ID ${doc.id}:`,
      )
      req.payload.logger.error(err)
    }
    return doc
  }
}
