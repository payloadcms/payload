import type { TypeWithID } from 'payload/dist/collections/config/types'
import type { FileData } from 'payload/dist/uploads/types'
import type { CollectionBeforeChangeHook, CollectionConfig } from 'payload/types'
import type { GeneratedAdapter } from '../types'
import { getIncomingFiles } from '../utilities/getIncomingFiles'

interface Args {
  collection: CollectionConfig
  adapter: GeneratedAdapter
}

export const getBeforeChangeHook =
  ({ collection, adapter }: Args): CollectionBeforeChangeHook<FileData & TypeWithID> =>
  async ({ req, data }) => {
    try {
      const files = getIncomingFiles({ req, data })

      const promises = files.map(async file => {
        await adapter.handleUpload({ collection, data, req, file })
      })

      await Promise.all(promises)
    } catch (err: unknown) {
      req.payload.logger.error(
        `There was an error while uploading files corresponding to the ${collection.labels?.singular} with filename ${data.filename}:`,
      )
      req.payload.logger.error(err)
    }
    return data
  }
