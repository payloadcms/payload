import type { ContainerClient } from '@azure/storage-blob'
import type { StaticHandler } from '@payloadcms/plugin-cloud-storage/types'
import type { CollectionConfig } from 'payload'

import { RestError } from '@azure/storage-blob'
import { getFilePrefix } from '@payloadcms/plugin-cloud-storage/utilities'
import path from 'path'

import { getRangeFromHeader } from './utils/getRangeFromHeader.js'

interface Args {
  collection: CollectionConfig
  getStorageClient: () => ContainerClient
}

export const getHandler = ({ collection, getStorageClient }: Args): StaticHandler => {
  return async (req, { headers: incomingHeaders, params: { clientUploadContext, filename } }) => {
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

      let initHeaders: Headers = {
        ...(response.headers.rawHeaders() as unknown as Headers),
      }

      // Typescript is difficult here with merging these types from Azure
      if (incomingHeaders) {
        initHeaders = {
          ...initHeaders,
          ...incomingHeaders,
        }
      }

      let headers = new Headers(initHeaders)

      const etagFromHeaders = req.headers.get('etag') || req.headers.get('if-none-match')
      const objectEtag = response.headers.get('etag')

      if (
        collection.upload &&
        typeof collection.upload === 'object' &&
        typeof collection.upload.modifyResponseHeaders === 'function'
      ) {
        headers = collection.upload.modifyResponseHeaders({ headers }) || headers
      }

      if (etagFromHeaders && etagFromHeaders === objectEtag) {
        return new Response(null, {
          headers,
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
        headers,
        status: response.status,
      })
    } catch (err: unknown) {
      if (err instanceof RestError && err.statusCode === 404) {
        return new Response(null, { status: 404, statusText: 'Not Found' })
      }
      req.payload.logger.error(err)
      return new Response('Internal Server Error', { status: 500 })
    }
  }
}
