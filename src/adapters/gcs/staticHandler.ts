import path from 'path'
import { Storage } from '@google-cloud/storage'
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
      return gcs
        .bucket(bucket)
        .file(path.posix.join(prefix, req.params.filename))
        .createReadStream()
        .pipe(res)
    } catch (err: unknown) {
      return next()
    }
  }
}
