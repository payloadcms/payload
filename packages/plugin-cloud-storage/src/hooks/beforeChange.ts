import type { FileData, TypeWithID } from 'payload/types'
import type { CollectionBeforeChangeHook, CollectionConfig } from 'payload/types'

import type { GeneratedAdapter } from '../types'

import { getIncomingFiles } from '../utilities/getIncomingFiles'

interface Args {
  adapter: GeneratedAdapter
  collection: CollectionConfig
}

export const getBeforeChangeHook =
  ({ adapter, collection }: Args): CollectionBeforeChangeHook<FileData & TypeWithID> =>
  async ({ data, originalDoc, req }) => {
    try {
      const files = getIncomingFiles({ data, req })

      if (files.length > 0) {
        // If there is an original doc,
        // And we have new files,
        // We need to delete the old files before uploading new
        // unless the collection is versioned (then only delete on delete)
        if (originalDoc && !collection.versions) {
          let filesToDelete: string[] = []

          if (typeof originalDoc?.filename === 'string') {
            filesToDelete.push(originalDoc.filename)
          }

          if (typeof originalDoc.sizes === 'object') {
            filesToDelete = filesToDelete.concat(
              Object.values(originalDoc?.sizes || []).map(
                (resizedFileData) => resizedFileData?.filename,
              ),
            )
          }

          const deletionPromises = filesToDelete.map(async (filename) => {
            if (filename) {
              await adapter.handleDelete({ collection, doc: originalDoc, filename, req })
            }
          })

          await Promise.all(deletionPromises)
        }

        const promises = files.map(async (file) => {
          await adapter.handleUpload({ collection, data, file, req })
        })

        await Promise.all(promises)
      }
    } catch (err: unknown) {
      req.payload.logger.error(
        `There was an error while uploading files corresponding to the collection ${collection.slug} with filename ${data.filename}:`,
      )
      req.payload.logger.error(err)
    }
    return data
  }
