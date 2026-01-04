import type { StaticHandler } from '@payloadcms/plugin-cloud-storage/types'
import type { v2 as cloudinary } from 'cloudinary'
import type { CollectionConfig } from 'payload'

import { getFilePrefix } from '@payloadcms/plugin-cloud-storage/utilities'
import path from 'path'

import { videoExtensions } from './index.js'

interface StaticHandlerArgs {
  collection: CollectionConfig
  folderSrc: string
  getStorageClient: () => typeof cloudinary
}

export const getStaticHandler = ({
  collection,
  folderSrc,
  getStorageClient,
}: StaticHandlerArgs): StaticHandler => {
  return async (req, { params: { filename } }) => {
    try {
      const prefix = await getFilePrefix({ collection, filename, req })
      const publicId = path.posix.join(folderSrc, prefix, filename)
      const extension = filename.toLowerCase().split('.').pop() as string
      const isVideo = videoExtensions.includes(extension)

      const resource = await getStorageClient().api.resource(publicId, {
        resource_type: isVideo ? 'video' : 'image',
      })

      const response = await fetch(resource.secure_url)

      if (!response.ok) {
        req.payload.logger.error(`Failed to fetch Cloudinary resource for ${filename}`)
        return new Response('Not Found', { status: 404 })
      }

      const headers = new Headers({
        'Content-Length': response.headers.get('content-length') || '0',
        'Content-Type': response.headers.get('content-type') || 'application/octet-stream',
      })

      return new Response(response.body, {
        headers,
        status: 200,
      })
    } catch (err) {
      req.payload.logger.error(err)
      return new Response('Internal Server Error', { status: 500 })
    }
  }
}
