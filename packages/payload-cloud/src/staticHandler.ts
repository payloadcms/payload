import type { CollectionConfig } from 'payload'

import type { CollectionCachingConfig, PluginOptions, StaticHandler } from './types.js'

import { createKey } from './utilities/createKey.js'
import { getStorageClient } from './utilities/getStorageClient.js'

interface Args {
  cachingOptions?: PluginOptions['uploadCaching']
  collection: CollectionConfig
}

// Convert a stream into a promise that resolves with a Buffer
const streamToBuffer = async (readableStream: any) => {
  const chunks = []
  for await (const chunk of readableStream) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }
  return Buffer.concat(chunks)
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

  return async (req, { params }) => {
    let key = ''
    try {
      const { identityID, storageClient } = await getStorageClient()

      key = createKey({
        collection: collection.slug,
        filename: params.filename,
        identityID,
      })

      const object = await storageClient.getObject({
        Bucket: process.env.PAYLOAD_CLOUD_BUCKET,
        Key: key,
      })

      if (!object.Body || !object.ContentType || !object.ETag) {
        return new Response(null, { status: 404, statusText: 'Not Found' })
      }

      const bodyBuffer = await streamToBuffer(object.Body)

      return new Response(bodyBuffer, {
        headers: new Headers({
          'Content-Length': String(object.ContentLength),
          'Content-Type': object.ContentType,
          ...(cachingEnabled && { 'Cache-Control': `public, max-age=${maxAge}` }),
          ETag: object.ETag,
        }),
        status: 200,
      })
    } catch (err: unknown) {
      /**
       * If object key does not found, the getObject function attempts a ListBucket operation.
       * Because of permissions, this will throw very specific error that we can catch and handle.
       */
      if (
        err instanceof Error &&
        err.name === 'AccessDenied' &&
        err.message?.includes('s3:ListBucket') &&
        'type' in err &&
        err.type === 'S3ServiceException'
      ) {
        req.payload.logger.error({
          collectionSlug: collection.slug,
          err,
          msg: `Requested file not found in cloud storage: ${params.filename}`,
          params,
          requestedKey: key,
        })
        return new Response(null, { status: 404, statusText: 'Not Found' })
      }

      req.payload.logger.error({
        collectionSlug: collection.slug,
        err,
        msg: `Error getting file from cloud storage: ${params.filename}`,
        params,
        requestedKey: key,
      })
      return new Response('Internal Server Error', { status: 500 })
    }
  }
}
