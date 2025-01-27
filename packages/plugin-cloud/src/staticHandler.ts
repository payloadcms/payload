import type { CollectionConfig } from 'payload/types'
import type { Readable } from 'stream'

import type { CollectionCachingConfig, PluginOptions, StaticHandler } from './types'

import { createKey } from './utilities/createKey'
import { getStorageClient } from './utilities/getStorageClient'

interface Args {
  cachingOptions?: PluginOptions['uploadCaching']
  collection: CollectionConfig
}

export const getStaticHandler = ({ cachingOptions, collection }: Args): StaticHandler => {
  let maxAge = 86400 // 24 hours default
  let collCacheConfig: CollectionCachingConfig | undefined
  if (cachingOptions !== false) {
    // Set custom maxAge for all collections
    maxAge = cachingOptions?.maxAge || maxAge
    collCacheConfig = cachingOptions?.collections?.[collection.slug] || {}
  }

  // Set maxAge using collection-specific override
  maxAge = collCacheConfig?.maxAge || maxAge

  const cachingEnabled =
    cachingOptions !== false &&
    !!process.env.PAYLOAD_CLOUD_CACHE_KEY &&
    collCacheConfig?.enabled !== false

  return async (req, res, next) => {
    const filename = req.params.filename
    let fileKeyWithPrefix = ''

    if (!filename) {
      req.payload.logger.warn({
        msg: `No filename provided for static file against collection: ${collection.slug}`,
      })
    }

    try {
      const { identityID, storageClient } = await getStorageClient()

      fileKeyWithPrefix = createKey({
        collection: collection.slug,
        filename,
        identityID,
      })

      const object = await storageClient.getObject({
        Bucket: process.env.PAYLOAD_CLOUD_BUCKET,
        Key: fileKeyWithPrefix,
      })

      res.set({
        'Content-Length': object.ContentLength,
        'Content-Type': object.ContentType,
        ...(cachingEnabled && { 'Cache-Control': `public, max-age=${maxAge}` }),
        ETag: object.ETag,
      })

      if (object?.Body) {
        return (object.Body as Readable).pipe(res)
      }

      return next()
    } catch (err: unknown) {
      req.payload.logger.error({
        err,
        msg: `Error getting file from cloud storage: '${fileKeyWithPrefix}'`,
      })
      return next()
    }
  }
}
