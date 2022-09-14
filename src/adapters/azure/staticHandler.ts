import type { ContainerClient } from '@azure/storage-blob'
import type { StaticHandler } from '../../types'

interface Args {
  containerClient: ContainerClient
}

export const getHandler = ({ containerClient }: Args): StaticHandler => {
  return async (req, res, next) => {
    try {
      const blockBlobClient = containerClient.getBlockBlobClient(req.params.filename)

      const blob = await blockBlobClient.download(0)

      res.set({
        'Content-Length': blob.contentLanguage,
        'Content-Type': blob.contentType,
        ETag: blob.etag,
      })

      if (blob?.readableStreamBody) {
        return blob.readableStreamBody.pipe(res)
      }

      return next()
    } catch (err: unknown) {
      return next()
    }
  }
}
