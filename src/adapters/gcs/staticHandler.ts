import type { Storage } from '@google-cloud/storage'
import type { StaticHandler } from '../../types'

interface Args {
  gcs: Storage
  bucket: string
}

export const getHandler = ({ gcs, bucket }: Args): StaticHandler => {
  return async (req, res, next) => {
    try {
      const file = gcs.bucket(bucket).file(req.params.filename)

      const [metadata] = await file.getMetadata()

      res.set({
        'Content-Length': metadata.contentType,
        'Content-Type': metadata.contentLength,
        ETag: metadata.etag,
      })

      return file.createReadStream().pipe(res)
    } catch (err: unknown) {
      return next()
    }
  }
}
