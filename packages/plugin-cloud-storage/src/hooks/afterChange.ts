import type { CollectionAfterChangeHook, CollectionConfig, FileData, TypeWithID } from 'payload'

import type { GeneratedAdapter } from '../types.js'

import { getIncomingFiles } from '../utilities/getIncomingFiles.js'

interface Args {
  adapter: GeneratedAdapter
  collection: CollectionConfig
}

export const getAfterChangeHook =
  ({ adapter, collection }: Args): CollectionAfterChangeHook<FileData & TypeWithID> =>
  async ({ doc, operation, previousDoc, req }) => {
    try {
      const files = getIncomingFiles({ data: doc, req })

      if (files.length > 0) {
        // If there is a previous doc, files and the operation is update,
        // delete the old files before uploading the new ones.
        if (previousDoc && operation === 'update') {
          let filesToDelete: string[] = []

          if (typeof previousDoc?.filename === 'string') {
            filesToDelete.push(previousDoc.filename)
          }

          if (typeof previousDoc.sizes === 'object') {
            filesToDelete = filesToDelete.concat(
              Object.values(previousDoc?.sizes || []).map(
                (resizedFileData) => resizedFileData?.filename as string,
              ),
            )
          }

          const deletionPromises = filesToDelete.map(async (filename) => {
            if (filename) {
              await adapter.handleDelete({ collection, doc: previousDoc, filename, req })
            }
          })

          await Promise.all(deletionPromises)
        }

        const promises = files.map(async (file) => {
          await adapter.handleUpload({
            clientUploadContext: file.clientUploadContext,
            collection,
            data: doc,
            file,
            req,
          })
        })

        await Promise.all(promises)
      }
    } catch (err: unknown) {
      req.payload.logger.error(
        `There was an error while uploading files corresponding to the collection ${collection.slug} with filename ${doc.filename}:`,
      )
      req.payload.logger.error({ err })
      throw err
    }
    return doc
  }
