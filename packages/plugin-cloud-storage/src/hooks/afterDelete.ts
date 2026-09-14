import type { CollectionAfterDeleteHook, CollectionConfig, FileData, TypeWithID } from 'payload'

import type { GeneratedAdapter, TypeWithPrefix } from '../types.js'

import { sanitizePrefix } from '../utilities/sanitizePrefix.js'

interface Args {
  adapter: GeneratedAdapter
  collection: CollectionConfig
}

// Fold `_objectKey` into the prefix so deletes target the real object folder.
const withObjectFolder = <T extends { _objectKey?: unknown } & TypeWithPrefix>(doc: T): T => {
  const safePrefix = sanitizePrefix(typeof doc.prefix === 'string' ? doc.prefix : '')
  const safeObjectKey = sanitizePrefix(typeof doc._objectKey === 'string' ? doc._objectKey : '')

  if (!safeObjectKey) {
    return doc
  }

  return { ...doc, prefix: safePrefix ? `${safePrefix}/${safeObjectKey}` : safeObjectKey }
}

export const getAfterDeleteHook = ({
  adapter,
  collection,
}: Args): CollectionAfterDeleteHook<FileData & TypeWithID & TypeWithPrefix> => {
  return async ({ doc, req }) => {
    try {
      const docForDelete = withObjectFolder(doc)

      const filesToDelete: string[] = [
        doc.filename,
        ...Object.values(doc?.sizes || []).map(
          (resizedFileData) => resizedFileData?.filename as string,
        ),
      ]

      const promises = filesToDelete.map(async (filename) => {
        if (filename) {
          await adapter.handleDelete({ collection, doc: docForDelete, filename, req })
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
