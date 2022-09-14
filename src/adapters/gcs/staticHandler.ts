import path from 'path'
import type { Storage } from '@google-cloud/storage'
import type { CollectionConfig } from 'payload/types'
import type { StaticHandler } from '../../types'
import { getFilePrefix } from '../../utilities/getFilePrefix'

interface Args {
  gcs: Storage
  bucket: string
  collection: CollectionConfig
}

export const getHandler = ({ gcs, bucket, collection }: Args): StaticHandler => {
  return async (req, res, next) => {
    try {
      const prefix = await getFilePrefix({ req, collection })
      const file = gcs.bucket(bucket).file(path.posix.join(prefix, req.params.filename))

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
