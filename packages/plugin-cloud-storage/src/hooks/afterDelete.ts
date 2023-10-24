import type { FileData, TypeWithID } from 'payload/types'
import type { CollectionAfterDeleteHook, CollectionConfig } from 'payload/types'

import type { GeneratedAdapter, TypeWithPrefix } from '../types'

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
        ...Object.values(doc?.sizes || []).map((resizedFileData) => resizedFileData?.filename),
      ]

      const promises = filesToDelete.map(async (filename) => {
        if (filename) await adapter.handleDelete({ collection, doc, filename, req })
      })

      await Promise.all(promises)
    } catch (err: unknown) {
      req.payload.logger.error(
        `There was an error while deleting files corresponding to the ${collection.labels?.singular} with ID ${doc.id}:`,
      )
      req.payload.logger.error(err)
    }
    return doc
  }
}
