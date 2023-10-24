import type { ContainerClient } from '@azure/storage-blob'
import type { CollectionConfig } from 'payload/types'

import path from 'path'

import type { StaticHandler } from '../../types'

import { getFilePrefix } from '../../utilities/getFilePrefix'
import getRangeFromHeader from '../../utilities/getRangeFromHeader'

interface Args {
  collection: CollectionConfig
  getStorageClient: () => ContainerClient
}

export const getHandler = ({ collection, getStorageClient }: Args): StaticHandler => {
  return async (req, res, next) => {
    try {
      const prefix = await getFilePrefix({ collection, req })
      const blockBlobClient = getStorageClient().getBlockBlobClient(
        path.posix.join(prefix, req.params.filename),
      )

      const { end, start } = await getRangeFromHeader(blockBlobClient, req.headers.range)

      const blob = await blockBlobClient.download(start, end)
      // eslint-disable-next-line no-underscore-dangle
      const response = blob._response
      res.header(response.headers.rawHeaders())
      res.status(response.status)

      if (blob?.readableStreamBody) {
        return blob.readableStreamBody.pipe(res)
      }

      return next()
    } catch (err: unknown) {
      return next()
    }
  }
}
