import { Storage } from '@google-cloud/storage'
import type { StaticHandler } from '../../types'

interface Args {
  gcs: Storage
  bucket: string
}

export const getHandler = ({ gcs, bucket }: Args): StaticHandler => {
  return async (req, res, next) => {
    try {
      return gcs.bucket(bucket).file(req.params.filename).createReadStream().pipe(res)
    } catch (err: unknown) {
      return next()
    }
  }
}
