import path from 'path'
import type { Readable } from 'stream'
import type * as AWS from '@aws-sdk/client-s3'
import type { CollectionConfig } from 'payload/types'
import type { StaticHandler } from '../../types'
import { getFilePrefix } from '../../utilities/getFilePrefix'

interface Args {
  s3: AWS.S3
  bucket: string
  collection: CollectionConfig
}

export const getHandler = ({ s3, bucket, collection }: Args): StaticHandler => {
  return async (req, res, next) => {
    try {
      const prefix = await getFilePrefix({ req, collection })
      const response = await s3.getObject({
        Bucket: bucket,
        Key: path.posix.join(prefix, req.params.filename),
      })

      if (response?.Body) {
        return (response.Body as Readable).pipe(res)
      }

      return next()
    } catch (err: unknown) {
      return next()
    }
  }
}
