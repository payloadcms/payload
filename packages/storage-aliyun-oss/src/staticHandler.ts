import type { StaticHandler } from '@payloadcms/plugin-cloud-storage/types'
import type OSS from 'ali-oss'
import type { CollectionConfig } from 'payload'

import { getFilePrefix } from '@payloadcms/plugin-cloud-storage/utilities'
import path from 'path'

interface Args {
  collection: CollectionConfig
  getStorageClient: () => OSS
}

export const getHandler = ({ collection, getStorageClient }: Args): StaticHandler => {
  return async (req, { params: { filename } }) => {
    try {
      const prefix = await getFilePrefix({ collection, filename, req })

      const object = await getStorageClient().get(path.posix.join(prefix, filename))

      if (!object.content) {
        return new Response(null, { status: 404, statusText: 'Not Found' })
      }

      return new Response(object.content, {
        headers: object.res.headers as HeadersInit,
        status: 200,
      })
    } catch (err) {
      req.payload.logger.error(err)
      return new Response('Internal Server Error', { status: 500 })
    }
  }
}
