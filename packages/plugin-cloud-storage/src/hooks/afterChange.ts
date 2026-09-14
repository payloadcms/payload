import type { CollectionAfterChangeHook, CollectionConfig, FileData, TypeWithID } from 'payload'

import { deepMergeWithSourceArrays } from 'payload'

import type { GeneratedAdapter } from '../types.js'

import { getIncomingFiles } from '../utilities/getIncomingFiles.js'
import { sanitizePrefix } from '../utilities/sanitizePrefix.js'

interface Args {
  adapter: GeneratedAdapter
  collection: CollectionConfig
}

// The object's folder: semantic prefix + `_objectKey` segment.
const getObjectFolder = (data: unknown): string => {
  const record = (data ?? {}) as Record<string, unknown>
  const safePrefix = sanitizePrefix(typeof record.prefix === 'string' ? record.prefix : '')
  const safeObjectKey = sanitizePrefix(
    typeof record._objectKey === 'string' ? record._objectKey : '',
  )

  if (safePrefix && safeObjectKey) {
    return `${safePrefix}/${safeObjectKey}`
  }

  return safePrefix || safeObjectKey
}

export const getAfterChangeHook =
  ({ adapter, collection }: Args): CollectionAfterChangeHook<FileData & TypeWithID> =>
  async ({ data, doc, operation, previousDoc, req, select }) => {
    // Skip if this is an internal update to prevent infinite loop
    if (req.context?.skipCloudStorage) {
      return doc
    }

    // Restore upload metadata removed by select, including partially selected image sizes.
    const uploadData = select ? deepMergeWithSourceArrays<FileData & TypeWithID>(data, doc) : doc
    const isDraftSave = (uploadData as { _status?: string })._status === 'draft'
    const isDraftOverPublished =
      isDraftSave && (previousDoc as { _status?: string } | undefined)?._status === 'published'

    try {
      const files = getIncomingFiles({ data: uploadData, req })

      if (files.length > 0) {
        // Fold `_objectKey` so generated sizes land in the same folder as the original.
        const dataForUpload = { ...uploadData, prefix: getObjectFolder(uploadData) }

        const uploadResults = await Promise.all(
          files
            .filter((file) => !file.uploadReference)
            .map((file) =>
              adapter.handleUpload({
                collection,
                data: dataForUpload,
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

        // Adapters may echo `data` back as metadata; keep the document's own `prefix`/`_objectKey`.
        delete (uploadMetadata as Record<string, unknown>).prefix
        delete (uploadMetadata as Record<string, unknown>)._objectKey

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
            const updatedDoc = await req.payload.update({
              id: doc.id,
              collection: collection.slug,
              data: uploadMetadata,
              depth: 0,
              draft: isDraftSave,
              req,
              select,
            })

            // Persist all adapter metadata, but do not add unselected fields to the response.
            docWithMetadata = select ? { ...doc, ...updatedDoc } : { ...doc, ...uploadMetadata }
          } finally {
            delete req.context.skipCloudStorage
          }
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
          const newFileData = { ...uploadData, ...uploadMetadata }
          const newFilenames = new Set<string>()
          if (typeof newFileData.filename === 'string') {
            newFilenames.add(newFileData.filename)
          }
          if (typeof newFileData.sizes === 'object') {
            for (const size of Object.values(newFileData.sizes || {})) {
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
