import type { Storage } from '@google-cloud/storage'
import type { CollectionConfig } from 'payload'

import path from 'path'

import type { StaticHandler } from '../../types.js'

import { getFilePrefix } from '../../utilities/getFilePrefix.js'

interface Args {
  bucket: string
  collection: CollectionConfig
  getStorageClient: () => Storage
}

export const getHandler = ({ bucket, collection, getStorageClient }: Args): StaticHandler => {
  return async (req, { params: { filename } }) => {
    try {
      const prefix = await getFilePrefix({ collection, filename, req })
      const file = getStorageClient().bucket(bucket).file(path.posix.join(prefix, filename))

      const [metadata] = await file.getMetadata()

      // Manually create a ReadableStream for the web from a Node.js stream.
      const readableStream = new ReadableStream({
        start(controller) {
          const nodeStream = file.createReadStream()
          nodeStream.on('data', (chunk) => {
            controller.enqueue(new Uint8Array(chunk))
          })
          nodeStream.on('end', () => {
            controller.close()
          })
          nodeStream.on('error', (err) => {
            controller.error(err)
          })
        },
      })

      return new Response(readableStream, {
        headers: new Headers({
          'Content-Length': String(metadata.size),
          'Content-Type': metadata.contentType,
          ETag: metadata.etag,
        }),
        status: 200,
      })
    } catch (err: unknown) {
      req.payload.logger.error(err)
      return new Response('Internal Server Error', { status: 500 })
    }
  }
}
