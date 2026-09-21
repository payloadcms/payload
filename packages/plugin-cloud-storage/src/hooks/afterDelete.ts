import type { CollectionAfterDeleteHook, CollectionConfig, FileData, TypeWithID } from 'payload'

import type { GeneratedAdapter, TypeWithPrefix } from '../types.js'

import { buildPrefixWithObjectKey } from '../utilities/buildPrefixWithObjectKey.js'
import { buildStoragePathData } from '../utilities/buildStoragePathData.js'

interface Args {
  adapter: GeneratedAdapter
  collection: CollectionConfig
  collectionPrefix?: string
  useCompositePrefixes?: boolean
}

export const getAfterDeleteHook = ({
  adapter,
  collection,
  collectionPrefix,
  useCompositePrefixes,
}: Args): CollectionAfterDeleteHook<FileData & TypeWithID & TypeWithPrefix> => {
  return async ({ doc, req }) => {
    try {
      // Fold `_objectKey` so deletes target the real object folder.
      const docPrefix = buildPrefixWithObjectKey({
        objectKey: (doc as { _objectKey?: string })._objectKey,
        prefix: doc.prefix,
      })

      const filesToDelete: string[] = [
        doc.filename,
        ...Object.values(doc?.sizes || []).map(
          (resizedFileData) => resizedFileData?.filename as string,
        ),
      ]

      const promises = filesToDelete.map(async (filename) => {
        if (filename) {
          const { storageFilePath } = buildStoragePathData({
            collectionPrefix,
            docPrefix,
            filename,
            useCompositePrefixes,
          })
          await adapter.handleDelete({ collection, doc, filename, req, storageFilePath })
        }
      })

      await Promise.all(promises)
    } catch (err: unknown) {
      req.payload.logger.error({
        err,
        msg: `There was an error while deleting files corresponding to the ${collection.labels?.singular} with ID ${doc.id}.`,
      })
    }
    return doc
  }
}
