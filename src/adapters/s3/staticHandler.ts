import path from 'path'
import type { Readable } from 'stream'
import type * as AWS from '@aws-sdk/client-s3'
import type { CollectionConfig } from 'payload/types'
import type { StaticHandler } from '../../types'
import { getFilePrefix } from '../../utilities/getFilePrefix'

interface Args {
  getStorageClient: () => AWS.S3
  bucket: string
  collection: CollectionConfig
}

export const getHandler = ({ getStorageClient, bucket, collection }: Args): StaticHandler => {
  return async (req, res, next) => {
    try {
      const prefix = await getFilePrefix({ req, collection })

      const object = await getStorageClient().getObject({
        Bucket: bucket,
        Key: path.posix.join(prefix, req.params.filename),
      })

      res.set({
        'Content-Length': object.ContentLength,
        'Content-Type': object.ContentType,
        ETag: object.ETag,
      })

      if (object?.Body) {
        return (object.Body as Readable).pipe(res)
      }

      return next()
    } catch (err: unknown) {
      req.payload.logger.error(err)
      return next()
    }
  }
}
