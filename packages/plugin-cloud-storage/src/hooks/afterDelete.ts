import type { CollectionAfterDeleteHook, CollectionConfig, FileData, TypeWithID } from 'payload'

import type { GeneratedAdapter, TypeWithPrefix } from '../types.js'

interface Args {
  adapter: GeneratedAdapter
  collection: CollectionConfig
}

export const getAfterDeleteHook = ({
  adapter,
  collection,
}: Args): CollectionAfterDeleteHook<FileData & TypeWithID & TypeWithPrefix> => {
  return async ({ doc, req }) => {
    try {
      const filesToDelete: string[] = [
        doc.filename,
        ...Object.values(doc?.sizes || []).map(
          (resizedFileData) => resizedFileData?.filename as string,
        ),
      ]

      const promises = filesToDelete.map(async (filename) => {
        if (filename) {
          await adapter.handleDelete({ collection, doc, filename, req })
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
