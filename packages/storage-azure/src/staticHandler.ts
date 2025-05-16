import type { ContainerClient } from '@azure/storage-blob'
import type { StaticHandler } from '@payloadcms/plugin-cloud-storage/types'
import type { CollectionConfig } from 'payload'

import { getFilePrefix } from '@payloadcms/plugin-cloud-storage/utilities'
import path from 'path'

import { getRangeFromHeader } from './utils/getRangeFromHeader.js'

interface Args {
  collection: CollectionConfig
  getStorageClient: () => ContainerClient
}

export const getHandler = ({ collection, getStorageClient }: Args): StaticHandler => {
  return async (req, { params: { clientUploadContext, filename } }) => {
    try {
      const prefix = await getFilePrefix({ clientUploadContext, collection, filename, req })
      const blockBlobClient = getStorageClient().getBlockBlobClient(
        path.posix.join(prefix, filename),
      )

      const { end, start } = await getRangeFromHeader(
        blockBlobClient,
        String(req.headers.get('range')),
      )

      const blob = await blockBlobClient.download(start, end)

      const response = blob._response

      const etagFromHeaders = req.headers.get('etag') || req.headers.get('if-none-match')
      const objectEtag = response.headers.get('etag')

      if (etagFromHeaders && etagFromHeaders === objectEtag) {
        return new Response(null, {
          headers: new Headers({
            ...response.headers.rawHeaders(),
          }),
          status: 304,
        })
      }

      // Manually create a ReadableStream for the web from a Node.js stream.
      const readableStream = new ReadableStream({
        start(controller) {
          const nodeStream = blob.readableStreamBody
          if (!nodeStream) {
            throw new Error('No readable stream body')
          }

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
        headers: response.headers.rawHeaders(),
        status: response.status,
      })
    } catch (err: unknown) {
      req.payload.logger.error(err)
      return new Response('Internal Server Error', { status: 500 })
    }
  }
}
