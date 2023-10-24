import type { TypeWithID } from 'payload/dist/globals/config/types'
import type { FileData } from 'payload/dist/uploads/types'
import type { CollectionAfterDeleteHook, CollectionConfig } from 'payload/types'
import type { GeneratedAdapter, TypeWithPrefix } from '../types'

interface Args {
  collection: CollectionConfig
  adapter: GeneratedAdapter
}

export const getAfterDeleteHook = ({
  collection,
  adapter,
}: Args): CollectionAfterDeleteHook<FileData & TypeWithID & TypeWithPrefix> => {
  return async ({ req, doc }) => {
    try {
      const filesToDelete: string[] = [
        doc.filename,
        ...Object.values(doc?.sizes || []).map(resizedFileData => resizedFileData?.filename),
      ]

      const promises = filesToDelete.map(async filename => {
        if (filename) await adapter.handleDelete({ collection, doc, req, filename })
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
