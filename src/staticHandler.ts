import type { CollectionConfig } from 'payload/types'
import type { Readable } from 'stream'
import type { StaticHandler } from './types'
import { createKey } from './utilities/createKey'
import { getStorageClient } from './utilities/getStorageClient'

interface Args {
  collection: CollectionConfig
}

export const getStaticHandler =
  ({ collection }: Args): StaticHandler =>
  async (req, res, next) => {
    try {
      const { storageClient, identityID } = await getStorageClient()

      const object = await storageClient.getObject({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: createKey({ collection: collection.slug, filename: req.params.filename, identityID }),
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
