import type { CollectionAfterChangeHook, CollectionConfig, FileData, TypeWithID } from 'payload'

import path from 'node:path'
import { isDeepStrictEqual } from 'node:util'
import { isolateObjectProperty } from 'payload'

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
      const files = getIncomingFiles({ data: uploadData, req })
      const mainClientUpload = files.find((file) => !file.sizeName)?.clientUpload

      if (files.length > 0) {
        // Fold `_objectKey` so generated sizes land in the same folder as the original.
        const dataForUpload = { ...uploadData, prefix: getObjectFolder(uploadData) }

        const filesToUpload = files.filter((file) =>
          file.clientUpload ? file.clientUpload.isProcessed : !file.clientUploadContext,
        )
        const originalDataForUpload = filesToUpload.length
          ? structuredClone(dataForUpload)
          : dataForUpload
        const uploadResults = await Promise.all(
          filesToUpload.map(async (file) => {
            const dataForFile = structuredClone(originalDataForUpload)
            const metadata = await adapter.handleUpload({
              clientUploadContext: file.clientUploadContext,
              collection,
              data: dataForFile,
              file,
              req,
              storageFilePath: buildUploadStoragePathData({
                collectionPrefix,
                docPrefix: dataForUpload.prefix,
                filename: file.filename,
                useCompositePrefixes,
              }).storageFilePath,
            })

            return { file, metadata }
          }),
        )

        const uploadMetadata = {} as Partial<FileData & TypeWithID>
        uploadResults.forEach(({ file, metadata }) => {
          if (!metadata || typeof metadata !== 'object') {
            return
          }

          const changedMetadata = Object.fromEntries(
            Object.entries(metadata).filter(([key, value]) => {
              const originalValue = originalDataForUpload[key as keyof StorageFileData]
              return !Object.is(value, originalValue) && !isDeepStrictEqual(value, originalValue)
            }),
          ) as Partial<StorageFileData>

          if (file.sizeName) {
            const { sizes, ...fileMetadata } = changedMetadata
            const originalSize = originalDataForUpload.sizes?.[file.sizeName] as
              | Record<string, unknown>
              | undefined
            const changedSizeMetadata = Object.fromEntries(
              Object.entries(sizes?.[file.sizeName] ?? {}).filter(([key, value]) => {
                const originalValue = originalSize?.[key]
                return !Object.is(value, originalValue) && !isDeepStrictEqual(value, originalValue)
              }),
            )
            const sizeMetadata = { ...fileMetadata, ...changedSizeMetadata }
            if (Object.keys(sizeMetadata).length > 0) {
              uploadMetadata.sizes = {
                ...uploadData.sizes,
                ...uploadMetadata.sizes,
                [file.sizeName]: {
                  ...uploadData.sizes[file.sizeName],
                  ...uploadMetadata.sizes?.[file.sizeName],
                  ...sizeMetadata,
                } as FileData['sizes'][string],
              }
            }
          } else {
            Object.assign(uploadMetadata, changedMetadata)
          }
        })

        const tempFilePath =
          req.file?.tempFilePath ??
          (req.context?._payloadCloudStorage as { file?: typeof req.file } | undefined)?.file
            ?.tempFilePath
        if (tempFilePath) {
          req.context ??= {}
          req.context._payloadCloudStorageTempFilePath = tempFilePath
        }
        req.file = undefined
        req.payloadUploadSizes = undefined
        if (req.context) {
          delete req.context._payloadCloudStorage
        }

        // Adapters may echo `data` back as metadata; keep the document's own `prefix`/`_objectKey`.
        delete (uploadMetadata as Record<string, unknown>).prefix
        delete (uploadMetadata as Record<string, unknown>)._objectKey

        let docWithMetadata = doc

        if (Object.keys(uploadMetadata).length > 0) {
          const metadataReq = isolateObjectProperty(req, [
            'context',
            'file',
            'payloadUploadSizes',
            'query',
          ])
          metadataReq.context = { ...req.context, skipCloudStorage: true }
          metadataReq.query = { ...req.query }
          metadataReq.file = undefined
          metadataReq.payloadUploadSizes = undefined
          delete metadataReq.query.uploadEdits
          delete metadataReq.context._payloadCloudStorage
          delete metadataReq.context._payloadCloudStorageTempFilePath
          delete metadataReq.context.payloadClientUploadTempFilePath

          const updatedDoc = await req.payload.update({
            id: doc.id,
            collection: collection.slug,
            data: uploadMetadata,
            depth: 0,
            draft: isDraftSave,
            overrideAccess: true,
            req: metadataReq,
          })

          // Persist all adapter metadata, but do not add unselected fields to the response.
          docWithMetadata = { ...doc, ...uploadMetadata }
          {
            if (updatedDoc.url !== undefined) {
              docWithMetadata.url = updatedDoc.url
            }
            if (updatedDoc.sizes) {
              // Only return size fields that the collection actually persisted.
              docWithMetadata.sizes = updatedDoc.sizes
            }
          }
        }

        // Delete previous files only after the new upload and metadata
        // persistence have succeeded. Deleting earlier would orphan the
        // record if a later step throws (e.g. a user-defined afterChange
        // hook on the same collection).
        const locationArgs = { collectionPrefix, useCompositePrefixes }
        const newLocations = getFileLocations({
          ...locationArgs,
          data: {
            ...uploadData,
            ...uploadMetadata,
            ...(!select ? docWithMetadata : {}),
          },
        })
        const previousLocations = previousDoc
          ? getFileLocations({ ...locationArgs, data: previousDoc })
          : new Map<string, string>()
        const filesToDelete = new Map<string, { doc: StorageFileData; filename: string }>()

        if (previousDoc && operation === 'update' && !isDraftOverPublished) {
          for (const [storageFilePath, filename] of previousLocations) {
            if (!newLocations.has(storageFilePath)) {
              filesToDelete.set(storageFilePath, { doc: previousDoc, filename })
            }
          }
        }

        if (mainClientUpload?.isProcessed) {
          const { originalStorageFilePath } = mainClientUpload
          const isRetainedPublishedFile =
            isDraftOverPublished && previousLocations.has(originalStorageFilePath)
          if (!newLocations.has(originalStorageFilePath) && !isRetainedPublishedFile) {
            filesToDelete.set(originalStorageFilePath, {
              doc: previousDoc ?? uploadData,
              filename: path.posix.basename(originalStorageFilePath),
            })
          }
        }

        await Promise.all(
          [...filesToDelete].map(([storageFilePath, { doc: deletedFileDoc, filename }]) =>
            adapter.handleDelete({
              collection,
              doc: deletedFileDoc,
              filename,
              req,
              storageFilePath,
            }),
          ),
        )

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

const getFileLocations = ({
  collectionPrefix,
  data,
  useCompositePrefixes,
}: {
  collectionPrefix?: string
  data: StorageFileData
  useCompositePrefixes?: boolean
}): Map<string, string> => {
  const filenames = [
    data.filename,
    ...Object.values(data.sizes ?? {}).map((size) => size?.filename),
  ]
  const locations = new Map<string, string>()

  for (const filename of filenames) {
    if (typeof filename === 'string' && filename) {
      const { storageFilePath } = buildStoragePathData({
        collectionPrefix,
        docPrefix: getObjectFolder(data),
        filename,
        useCompositePrefixes,
      })
      locations.set(storageFilePath, filename)
    }
  }

  return locations
}
