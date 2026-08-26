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
    // Skip if this is an internal update to prevent infinite loop
    if (req.context?.skipCloudStorage) {
      return doc
    }

    const isDraftSave = (doc as { _status?: string })._status === 'draft'
    const isDraftOverPublished =
      isDraftSave && (previousDoc as { _status?: string } | undefined)?._status === 'published'

    try {
      const files = getIncomingFiles({ data: doc, req })

      if (files.length > 0) {
        const uploadResults = await Promise.all(
          files
            .filter((file) => !file.uploadReference)
            .map((file) =>
              adapter.handleUpload({
                collection,
                data: doc,
                file,
                req,
              }),
            ),
        )

        const uploadMetadata = uploadResults
          .filter(
            (result): result is Partial<FileData & TypeWithID> =>
              result != null && typeof result === 'object',
          )
          .reduce(
            (acc, metadata) => ({ ...acc, ...metadata }),
            {} as Partial<FileData & TypeWithID>,
          )

        let docWithMetadata = doc

        if (Object.keys(uploadMetadata).length > 0) {
          if (!req.context) {
            req.context = {}
          }
          req.context.skipCloudStorage = true

          // Clear to prevent re-processing
          req.file = undefined
          req.payloadUploadSizes = undefined

          try {
            await req.payload.update({
              id: doc.id,
              collection: collection.slug,
              data: uploadMetadata,
              depth: 0,
              draft: isDraftSave,
              req,
            })
          } finally {
            delete req.context.skipCloudStorage
          }

          docWithMetadata = { ...doc, ...uploadMetadata }
        }

        // Delete previous files only after the new upload and metadata
        // persistence have succeeded. Deleting earlier would orphan the
        // record if a later step throws (e.g. a user-defined afterChange
        // hook on the same collection).
        if (previousDoc && operation === 'update' && !isDraftOverPublished) {
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

          // Collect new filenames (main + sizes) so we don't delete a
          // file that the new upload reused (e.g. same filename on reupload
          // where Payload overwrites in place).
          const newFilenames = new Set<string>()
          if (typeof docWithMetadata.filename === 'string') {
            newFilenames.add(docWithMetadata.filename)
          }
          if (typeof docWithMetadata.sizes === 'object') {
            for (const size of Object.values(docWithMetadata.sizes || {})) {
              if (size?.filename && typeof size.filename === 'string') {
                newFilenames.add(size.filename)
              }
            }
          }

          const deletionPromises = filesToDelete.map(async (filename) => {
            if (filename && !newFilenames.has(filename)) {
              await adapter.handleDelete({ collection, doc: previousDoc, filename, req })
            }
          })

          await Promise.all(deletionPromises)
        }

        if (docWithMetadata !== doc) {
          return docWithMetadata
        }
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
