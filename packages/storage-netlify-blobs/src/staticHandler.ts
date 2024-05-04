import type { Store } from '@netlify/blobs'
import type { StaticHandler } from '@payloadcms/plugin-cloud-storage/types'
import type { CollectionConfig } from 'payload/types'

import { getFilePrefix } from '@payloadcms/plugin-cloud-storage/utilities'
import path from 'path'

type StaticHandlerArgs = {
  store: Store
}

export const getStaticHandler = (
  { store }: StaticHandlerArgs,
  collection: CollectionConfig,
): StaticHandler => {
  return async (req, { params: { filename } }) => {
    try {
      const prefix = await getFilePrefix({ collection, filename, req })

      const key = prefix ? path.posix.join(prefix, filename) : filename

      const etag = req.headers.get('If-None-Match') ?? undefined

      const res = await store.getWithMetadata(key, { type: 'stream', etag })

      if (!res) {
        return new Response('Not Found', { status: 404 })
      }

      if (!res.data && res.metadata.etag === etag) {
        return new Response(null, { status: 304 })
      }

      return new Response(res.data, {
        headers: new Headers({
          'Content-Length': String(res.metadata.contentLength),
          'Content-Type': String(res.metadata.contentType ?? 'application/octet-stream'),
          ETag: res.etag ?? '',
        }),
        status: 200,
      })
    } catch (err: unknown) {
      req.payload.logger.error({ err, msg: 'Unexpected error in staticHandler' })
      return new Response('Internal Server Error', { status: 500 })
    }
  }
}
