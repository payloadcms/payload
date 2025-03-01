import type { GenerateURL } from '@payloadcms/plugin-cloud-storage/types'
import type { v2 as cloudinary } from 'cloudinary'

import path from 'path'

import { videoExtensions } from './index.js'

interface GenerateUrlArgs {
  folderSrc: string
  getStorageClient: () => typeof cloudinary
}

export const getGenerateUrl = ({ folderSrc, getStorageClient }: GenerateUrlArgs): GenerateURL => {
  return async ({ filename, prefix = '' }) => {
    const publicId = path.posix.join(folderSrc, prefix, filename)
    const extension = filename.toLowerCase().split('.').pop() as string
    const isVideo = videoExtensions.includes(extension)

    const resource = await getStorageClient().api.resource(publicId, {
      resource_type: isVideo ? 'video' : 'image',
    })

    return resource.secure_url
  }
}
