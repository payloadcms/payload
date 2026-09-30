import type { CollectionAfterChangeHook, CollectionConfig, FileData, TypeWithID } from 'payload'

import type { GeneratedAdapter } from '../types.js'

import { buildPrefixWithObjectKey } from '../utilities/buildPrefixWithObjectKey.js'
import {
  buildStoragePathData,
  buildUploadStoragePathData,
} from '../utilities/buildStoragePathData.js'
import { getIncomingFiles } from '../utilities/getIncomingFiles.js'

type StorageFileData = { _objectKey?: string } & FileData & TypeWithID

interface Args {
  adapter: GeneratedAdapter
  collection: CollectionConfig
  collectionPrefix?: string
  useCompositePrefixes?: boolean
}

// The object's folder: semantic prefix + `_objectKey` segment.
const getObjectFolder = (doc: unknown): string => {
  const record = (doc ?? {}) as { _objectKey?: string; prefix?: string }
  return buildPrefixWithObjectKey({ objectKey: record._objectKey, prefix: record.prefix })
}

export const getAfterChangeHook =
  ({
    adapter,
    collection,
    collectionPrefix,
    useCompositePrefixes,
  }: Args): CollectionAfterChangeHook<StorageFileData> =>
  async ({ data, doc, operation, previousDoc, req }) => {
    // Skip if this is an internal update to prevent infinite loop
    if (req.context?.skipCloudStorage) {
      return doc
    }

    const uploadData = { ...doc, _objectKey: data?._objectKey ?? doc._objectKey }
    const isDraftSave = (doc as { _status?: string })._status === 'draft'
    const isDraftOverPublished =
      isDraftSave && (previousDoc as { _status?: string } | undefined)?._status === 'published'

    try {
      const files = getIncomingFiles({ data: doc, req })

      if (files.length > 0) {
        // Fold `_objectKey` so generated sizes land in the same folder as the original.
        const dataForUpload = { ...uploadData, prefix: getObjectFolder(uploadData) }

        // Files with a clientUploadContext are already in storage.
        const filesToUpload = files.filter((file) => !file.clientUploadContext)
        const uploadResults = await Promise.all(
          filesToUpload.map((file) =>
            adapter.handleUpload({
              clientUploadContext: file.clientUploadContext,
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

        const uploadMetadata = {} as Partial<FileData & TypeWithID>
        uploadResults.forEach((metadata, index) => {
          if (!metadata || typeof metadata !== 'object' || metadata === dataForUpload) {
            return
          }

          const size = Object.entries(uploadData.sizes ?? {}).find(
            ([, value]) => value?.filename === filesToUpload[index]?.filename,
          )

          if (size) {
            uploadMetadata.sizes = {
              ...uploadData.sizes,
              ...uploadMetadata.sizes,
              [size[0]]: { ...size[1], ...metadata },
            }
          } else {
            Object.assign(uploadMetadata, metadata)
          }
        })

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
          const uploadEdits = req.query?.uploadEdits
          if (req.query) {
            delete req.query.uploadEdits
          }

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
            if (req.query && uploadEdits !== undefined) {
              req.query.uploadEdits = uploadEdits
            }
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

          // Compare full locations: a replacement can reuse a filename while moving
          // a legacy object beneath the collection prefix.
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

          // Resolve each object's real location, folding `_objectKey` so a client-uploaded
          // original is compared and deleted at `prefix/_objectKey/filename`.
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
                data: { ...uploadData, ...uploadMetadata },
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
