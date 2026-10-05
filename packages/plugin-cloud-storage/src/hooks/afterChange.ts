import type { CollectionAfterChangeHook, CollectionConfig, FileData, TypeWithID } from 'payload'

import { deepMergeWithSourceArrays, MAIN_BRANCH, scheduleAfterTransactionCommit } from 'payload'

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

          if (typeof previousDoc.variants === 'object') {
            filesToDelete = filesToDelete.concat(
              Object.values(previousDoc?.variants || []).map(
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
          if (typeof newFileData.variants === 'object') {
            for (const size of Object.values(newFileData.variants || {})) {
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
          const branchDocumentID = getBranchDocumentID(previousDoc)

          if (branchDocumentID !== undefined) {
            const retainedMainDocument = (await req.payload.db.findOne({
              branch: false,
              collection: collection.slug,
              req,
              where: {
                and: [{ _branch: { equals: MAIN_BRANCH } }, { id: { equals: branchDocumentID } }],
              },
            })) as null | Record<string, unknown>

            if (retainedMainDocument) {
              for (const filename of getDocumentFilenames(retainedMainDocument)) {
                newKeys.add(
                  resolveKey({
                    data: retainedMainDocument as { _objectKey?: string; prefix?: string },
                    filename,
                  }),
                )
              }
            }
          }

          const deletionTargets = filesToDelete.flatMap((filename) => {
            if (!filename) {
              return []
            }
            const storageFilePath = resolveKey({
              data: previousDoc as { _objectKey?: string; prefix?: string },
              filename,
            })
            return newKeys.has(storageFilePath) ? [] : [{ filename, storageFilePath }]
          })

          await scheduleAfterTransactionCommit({
            callback: async () => {
              await Promise.all(
                deletionTargets.map(({ filename, storageFilePath }) =>
                  adapter.handleDelete({
                    collection,
                    doc: previousDoc,
                    filename,
                    req,
                    storageFilePath,
                  }),
                ),
              )
            },
            req,
          })
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

const getBranchDocumentID = (doc: unknown): number | string | undefined => {
  if (!doc || typeof doc !== 'object' || Array.isArray(doc)) {
    return undefined
  }

  const branchDocument = doc as Record<string, unknown>

  if (branchDocument._branch === MAIN_BRANCH) {
    return undefined
  }

  const relation = branchDocument._branchDocID
  const value =
    relation && typeof relation === 'object' && !Array.isArray(relation) && 'value' in relation
      ? relation.value
      : relation

  return typeof value === 'number' || typeof value === 'string' ? value : undefined
}

const getDocumentFilenames = (doc: Record<string, unknown>): string[] => {
  const filenames = typeof doc.filename === 'string' ? [doc.filename] : []

  if (doc.variants && typeof doc.variants === 'object' && !Array.isArray(doc.variants)) {
    for (const variant of Object.values(doc.variants)) {
      if (
        variant &&
        typeof variant === 'object' &&
        !Array.isArray(variant) &&
        'filename' in variant &&
        typeof variant.filename === 'string'
      ) {
        filenames.push(variant.filename)
      }
    }
  }

  return filenames
}
