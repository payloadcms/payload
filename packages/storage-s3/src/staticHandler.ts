import type * as AWS from '@aws-sdk/client-s3'
import type { StaticHandler } from '@payloadcms/plugin-cloud-storage/types'
import type { CollectionConfig } from 'payload'

import { getFilePrefix } from '@payloadcms/plugin-cloud-storage/utilities'
import path from 'path'

interface Args {
  bucket: string
  collection: CollectionConfig
  getStorageClient: () => AWS.S3
}

// Convert a stream into a promise that resolves with a Buffer
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const streamToBuffer = async (readableStream: any) => {
  const chunks = []
  for await (const chunk of readableStream) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }
  return Buffer.concat(chunks)
}

export const getHandler = ({ bucket, collection, getStorageClient }: Args): StaticHandler => {
  return async (req, { params: { filename } }) => {
    try {
      const prefix = await getFilePrefix({ collection, filename, req })

      const object = await getStorageClient().getObject({
        Bucket: bucket,
        Key: path.posix.join(prefix, filename),
      })

      if (!object.Body) {
        return new Response(null, { status: 404, statusText: 'Not Found' })
      }

      const bodyBuffer = await streamToBuffer(object.Body)

      return new Response(bodyBuffer, {
        headers: new Headers({
          'Accept-Ranges': String(object.AcceptRanges),
          'Content-Length': String(object.ContentLength),
          'Content-Type': String(object.ContentType),
          ETag: String(object.ETag),
        }),
        status: 200,
      })
    } catch (err) {
      req.payload.logger.error(err)
      return new Response('Internal Server Error', { status: 500 })
    }
  }
}
