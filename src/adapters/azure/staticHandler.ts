import type { ContainerClient } from '@azure/storage-blob'
import type { StaticHandler } from '../../types'

interface Args {
  containerClient: ContainerClient
}

export const getHandler = ({ containerClient }: Args): StaticHandler => {
  return async (req, res, next) => {
    try {
      const blockBlobClient = containerClient.getBlockBlobClient(req.params.filename)

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
