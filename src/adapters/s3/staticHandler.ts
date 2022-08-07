import type { Readable } from 'stream'
import type * as AWS from '@aws-sdk/client-s3'
import type { StaticHandler } from '../../types'

interface Args {
  s3: AWS.S3
  bucket: string
}

export const getHandler = ({ s3, bucket }: Args): StaticHandler => {
  return async (req, res, next) => {
    try {
      const response = await s3.getObject({
        Bucket: bucket,
        Key: req.params.filename,
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
