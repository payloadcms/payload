import path from 'path'
import type { ContainerClient } from '@azure/storage-blob'
import type { CollectionConfig } from 'payload/types'
import type { StaticHandler } from '../../types'
import { getFilePrefix } from '../../utilities/getFilePrefix'

interface Args {
  containerClient: ContainerClient
  collection: CollectionConfig
}

export const getHandler = ({ containerClient, collection }: Args): StaticHandler => {
  return async (req, res, next) => {
    try {
      const prefix = await getFilePrefix({ req, collection })
      const blockBlobClient = containerClient.getBlockBlobClient(
        path.posix.join(prefix, req.params.filename),
      )

      const downloadBlockBlobResponse = await blockBlobClient.download(0)

      if (downloadBlockBlobResponse?.readableStreamBody) {
        return downloadBlockBlobResponse.readableStreamBody.pipe(res)
      }

      return next()
    } catch (err: unknown) {
      return next()
    }
  }
}
