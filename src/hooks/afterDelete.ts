import type { TypeWithID } from 'payload/dist/globals/config/types'
import type { FileData } from 'payload/dist/uploads/types'
import type { CollectionAfterDeleteHook, CollectionConfig } from 'payload/types'
import type { GeneratedAdapter } from '../types'

interface Args {
  collection: CollectionConfig
  adapter: GeneratedAdapter
}

export const getAfterDeleteHook =
  ({ collection, adapter }: Args): CollectionAfterDeleteHook<FileData & TypeWithID> =>
  async ({ req, doc }) => {
    try {
      await adapter.handleDelete({ collection, doc, req })
    } catch (err: unknown) {
      req.payload.logger.error(
        `There was an error while deleting files corresponding to the ${collection.labels?.singular} with ID ${doc.id}:`,
      )
      req.payload.logger.error(err)
    }
    return doc
  }
