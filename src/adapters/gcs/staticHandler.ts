import path from 'path'
import type { Storage } from '@google-cloud/storage'
import type { CollectionConfig } from 'payload/types'
import type { StaticHandler } from '../../types'
import { getFilePrefix } from '../../utilities/getFilePrefix'

interface Args {
  getStorageClient: () => Storage
  bucket: string
  collection: CollectionConfig
}

export const getHandler = ({ getStorageClient, bucket, collection }: Args): StaticHandler => {
  return async (req, res, next) => {
    try {
      const prefix = await getFilePrefix({ req, collection })
      const file = getStorageClient()
        .bucket(bucket)
        .file(path.posix.join(prefix, req.params.filename))

      const [metadata] = await file.getMetadata()

      res.set({
        'Content-Length': metadata.size,
        'Content-Type': metadata.contentType,
        ETag: metadata.etag,
      })

      return file.createReadStream().pipe(res)
    } catch (err: unknown) {
      return next()
    }
  }
}
