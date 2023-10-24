import type { TypeWithID } from 'payload/dist/collections/config/types'
import type { FileData } from 'payload/dist/uploads/types'
import type { CollectionBeforeChangeHook, CollectionConfig } from 'payload/types'
import type { GeneratedAdapter } from '../types'
import { getIncomingFiles } from '../utilities/getIncomingFiles'

interface Args {
  collection: CollectionConfig
  adapter: GeneratedAdapter
}

export const getBeforeChangeHook =
  ({ collection, adapter }: Args): CollectionBeforeChangeHook<FileData & TypeWithID> =>
  async ({ req, data, originalDoc }) => {
    try {
      const files = getIncomingFiles({ req, data })

      if (files.length > 0) {
        // If there is an original doc,
        // And we have new files,
        // We need to delete the old files before uploading new
        if (originalDoc) {
          let filesToDelete: string[] = []

          if (typeof originalDoc?.filename === 'string') {
            filesToDelete.push(originalDoc.filename)
          }

          if (typeof originalDoc.sizes === 'object') {
            filesToDelete = filesToDelete.concat(
              Object.values(originalDoc?.sizes || []).map(
                resizedFileData => resizedFileData?.filename,
              ),
            )
          }

          const deletionPromises = filesToDelete.map(async filename => {
            if (filename) {
              await adapter.handleDelete({ collection, doc: originalDoc, req, filename })
            }
          })

          await Promise.all(deletionPromises)
        }

        const promises = files.map(async file => {
          await adapter.handleUpload({ collection, data, req, file })
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
