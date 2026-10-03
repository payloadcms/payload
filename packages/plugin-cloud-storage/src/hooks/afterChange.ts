import type { CollectionAfterChangeHook, CollectionConfig, FileData, TypeWithID } from 'payload'

import { deepMergeWithSourceArrays } from 'payload'

import type { GeneratedAdapter } from '../types.js'

import { buildPrefixWithObjectKey } from '../utilities/buildPrefixWithObjectKey.js'
import {
  buildStoragePathData,
  buildUploadStoragePathData,
} from '../utilities/buildStoragePathData.js'
import { getIncomingFiles } from '../utilities/getIncomingFiles.js'

interface Args {
  adapter: GeneratedAdapter
  collection: CollectionConfig
  collectionPrefix?: string
  useCompositePrefixes?: boolean
}

// The object's folder: semantic prefix + `_objectKey` segment.
const getObjectFolder = (data: unknown): string => {
  const record = (data ?? {}) as { _objectKey?: string; prefix?: string }
  return buildPrefixWithObjectKey({ objectKey: record._objectKey, prefix: record.prefix })
}

export const getAfterChangeHook =
  ({
    adapter,
    collection,
    collectionPrefix,
    useCompositePrefixes,
  }: Args): CollectionAfterChangeHook<FileData & TypeWithID> =>
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
                storageFilePath: buildUploadStoragePathData({
                  collectionPrefix,
                  docPrefix: dataForUpload.prefix,
                  filename: file.filename,
                  useCompositePrefixes,
                }).storageFilePath,
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

          // `req.query.uploadEdits` (crop / resize / focal point) has already
          // been consumed by the original request's `generateFileData`. The
          // nested update below re-reads it straight from `req.query` and would
          // re-enter the file re-processing path, re-cropping the already-cropped
          // file. Drop it so the metadata persistence stays data-only.
          if (req.query && 'uploadEdits' in req.query) {
            delete req.query.uploadEdits
          }

          try {
            const updatedDoc = await req.payload.update({
              id: doc.id,
              collection: collection.slug,
              data: uploadMetadata,
              depth: 0,
              draft: isDraftSave,
              overrideAccess: true,
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

          // Compare full locations: a replacement can reuse a filename while moving
          // a legacy object beneath the collection prefix.
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

          const resolveKey = ({
            data,
            filename,
          }: {
            data: { _objectKey?: string; prefix?: string }
            filename: string
          }) =>
            buildStoragePathData({
              collectionPrefix,
              docPrefix: getObjectFolder(data),
              filename,
              useCompositePrefixes,
            }).storageFilePath
          const newKeys = new Set(
            [...newFilenames].map((filename) =>
              resolveKey({
                data: newFileData as { _objectKey?: string; prefix?: string },
                filename,
              }),
            ),
          )

          const deletionPromises = filesToDelete.map(async (filename) => {
            if (!filename) {
              return
            }
            const storageFilePath = resolveKey({
              data: previousDoc as { _objectKey?: string; prefix?: string },
              filename,
            })
            if (!newKeys.has(storageFilePath)) {
              await adapter.handleDelete({
                collection,
                doc: previousDoc,
                filename,
                req,
                storageFilePath,
              })
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
