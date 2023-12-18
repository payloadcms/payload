import type { Storage } from '@google-cloud/storage'
import type { CollectionConfig } from 'payload/types'

import path from 'path'

import type { StaticHandler } from '../../types'

import { getFilePrefix } from '../../utilities/getFilePrefix'

interface Args {
  bucket: string
  collection: CollectionConfig
  getStorageClient: () => Storage
}

export const getHandler = ({ bucket, collection, getStorageClient }: Args): StaticHandler => {
  return async (req, res, next) => {
    try {
      const prefix = await getFilePrefix({ collection, req })
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
