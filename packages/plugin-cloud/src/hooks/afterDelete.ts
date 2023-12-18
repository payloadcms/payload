import type { TypeWithID } from 'payload/types'
import type { FileData } from 'payload/types'
import type { CollectionAfterDeleteHook, CollectionConfig } from 'payload/types'

import type { TypeWithPrefix } from '../types'

import { createKey } from '../utilities/createKey'
import { getStorageClient } from '../utilities/getStorageClient'

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
        doc.filename,
        ...Object.values(doc?.sizes || []).map((resizedFileData) => resizedFileData?.filename),
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
