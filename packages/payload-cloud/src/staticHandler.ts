import type { CollectionConfig } from 'payload'
import type { Readable } from 'stream'

import type { CollectionCachingConfig, PluginOptions, StaticHandler } from './types.js'

import { createKey } from './utilities/createKey.js'
import { getStorageClient } from './utilities/getStorageClient.js'

interface Args {
  cachingOptions?: PluginOptions['uploadCaching']
  collection: CollectionConfig
  debug?: boolean
}

// Type guard for NodeJS.Readable streams
const isNodeReadableStream = (body: unknown): body is Readable => {
  return (
    typeof body === 'object' &&
    body !== null &&
    'pipe' in body &&
    typeof (body as any).pipe === 'function' &&
    'destroy' in body &&
    typeof (body as any).destroy === 'function'
  )
}

// Convert a stream into a promise that resolves with a Buffer
const streamToBuffer = async (readableStream: any) => {
  const chunks = []
  for await (const chunk of readableStream) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }
  return Buffer.concat(chunks)
}

export const getStaticHandler = ({ cachingOptions, collection, debug }: Args): StaticHandler => {
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

      // On error, manually destroy stream to close socket
      if (object.Body && isNodeReadableStream(object.Body)) {
        const stream = object.Body
        stream.on('error', (err) => {
          req.payload.logger.error({
            err,
            key,
            msg: 'Error streaming S3 object, destroying stream',
          })
          stream.destroy()
        })
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
      // Handle each error explicitly
      if (err instanceof Error) {
        /**
         * Note: If AccessDenied comes back, it typically means that the object key is not found.
         * The AWS SDK throws this because it attempts an s3:ListBucket operation under the hood
         * if it does not find the object key, which we have disallowed in our bucket policy.
         */
        if (err.name === 'AccessDenied') {
          req.payload.logger.warn({
            awsErr: debug ? err : err.name,
            collectionSlug: collection.slug,
            msg: `Requested file not found in cloud storage: ${params.filename}`,
            params,
            requestedKey: key,
          })
          return new Response(null, { status: 404, statusText: 'Not Found' })
        } else if (err.name === 'NoSuchKey') {
          req.payload.logger.warn({
            awsErr: debug ? err : err.name,
            collectionSlug: collection.slug,
            msg: `Requested file not found in cloud storage: ${params.filename}`,
            params,
            requestedKey: key,
          })
          return new Response(null, { status: 404, statusText: 'Not Found' })
        }
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
