import type { Readable } from 'stream'
import type * as AWS from '@aws-sdk/client-s3'
import type { StaticHandler } from '../../types'

interface Args {
  s3: AWS.S3
  bucket: string
}

export const getHandler = ({ s3, bucket }: Args): StaticHandler => {
  return async (req, res, next) => {
    const params = {
      Bucket: bucket,
      Key: req.params.filename,
    }

    try {
      const object = await s3.getObject(params)

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
