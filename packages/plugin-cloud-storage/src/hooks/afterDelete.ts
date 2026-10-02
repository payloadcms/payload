import type {
  CollectionAfterDeleteHook,
  CollectionConfig,
  FileData,
  PayloadRequest,
  TypeWithID,
} from 'payload'

import {
  beginDeferredCleanupScopeIfNeeded,
  clearDeferredCleanupScope,
  flushDeferredCleanupScope,
  scheduleAfterTransactionCommit,
} from 'payload'

import type { GeneratedAdapter, TypeWithPrefix } from '../types.js'

import { buildPrefixWithObjectKey } from '../utilities/buildPrefixWithObjectKey.js'
import { buildStoragePathData } from '../utilities/buildStoragePathData.js'

interface Args {
  adapter: GeneratedAdapter
  collection: CollectionConfig
  collectionPrefix?: string
  useCompositePrefixes?: boolean
}

type UploadDocument = { _objectKey?: string } &
  FileData &
  TypeWithID &
  TypeWithPrefix

export const getAfterDeleteHook = ({
  adapter,
  collection,
  collectionPrefix,
  useCompositePrefixes,
}: Args): CollectionAfterDeleteHook<FileData & TypeWithID & TypeWithPrefix> => {
  const logDeleteError = ({ doc, err, req }: { doc: TypeWithID; err: unknown; req: PayloadRequest }) => {
    req.payload.logger.error({
      err,
      msg: `There was an error while deleting files for collection ${collection.slug} document ${doc.id}.`,
    })
  }
  const deleteFiles = getDeleteFiles({
    adapter,
    collection,
    collectionPrefix,
    useCompositePrefixes,
  })

  return async ({ doc, req }) => {
    try {
      await deleteFiles({
        onError: (err) => {
          logDeleteError({ doc, err, req })
        },
        req,
        sourceDoc: doc,
      })
    } catch (err: unknown) {
      logDeleteError({ doc, err, req })
    }

    return doc
  }
}

export const getDeleteFiles =
  ({ adapter, collection, collectionPrefix, useCompositePrefixes }: Args) =>
  async ({
    onError,
    req,
    retainedDoc,
    sourceDoc,
  }: {
    onError?: (error: unknown) => void
    req: PayloadRequest
    retainedDoc?: null | object
    sourceDoc: object
  }) => {
    const cleanupScope = await beginDeferredCleanupScopeIfNeeded({ req })
    const sourceUploadDocument = sourceDoc as UploadDocument
    const retainedUploadDocument = retainedDoc as null | undefined | UploadDocument
    const resolveKey = ({ doc, filename }: { doc: UploadDocument; filename: string }) => {
      const docPrefix = buildPrefixWithObjectKey({
        objectKey: doc._objectKey,
        prefix: doc.prefix,
      })

      return buildStoragePathData({
        collectionPrefix,
        docPrefix,
        filename,
        useCompositePrefixes,
      }).storageFilePath
    }
    const retainedStoragePaths = new Set(
      retainedUploadDocument
        ? getFilenames(retainedUploadDocument).map((filename) =>
            resolveKey({ doc: retainedUploadDocument, filename }),
          )
        : [],
    )

    const filesToDelete = getFilenames(sourceUploadDocument).flatMap((filename) => {
      const storageFilePath = resolveKey({ doc: sourceUploadDocument, filename })

      return retainedStoragePaths.has(storageFilePath) ? [] : [{ filename, storageFilePath }]
    })

    try {
      await scheduleAfterTransactionCommit({
        callback: async () => {
          try {
            await Promise.all(
              filesToDelete.map(({ filename, storageFilePath }) =>
                adapter.handleDelete({
                  collection,
                  doc: sourceUploadDocument,
                  filename,
                  req,
                  storageFilePath,
                }),
              ),
            )
          } catch (error) {
            if (onError) {
              onError(error)
              return
            }

            throw error
          }
        },
        req,
      })

      if (cleanupScope) {
        await flushDeferredCleanupScope({ req, scope: cleanupScope })
      }
    } catch (error) {
      if (cleanupScope) {
        clearDeferredCleanupScope({ req, scope: cleanupScope })
      }

      throw error
    }
  }

const getFilenames = (doc: FileData): string[] =>
  [
    doc.filename,
    ...Object.values(doc.sizes || {}).map((resizedFileData) => resizedFileData?.filename),
  ].filter((filename): filename is string => typeof filename === 'string' && filename.length > 0)
