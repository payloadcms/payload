import type { HandleDelete } from '@payloadcms/plugin-cloud-storage/types'
import type { v2 as cloudinary } from 'cloudinary'

import path from 'path'

interface HandleDeleteArgs {
  folderSrc: string
  getStorageClient: () => typeof cloudinary
}

export const getHandleDelete = ({
  folderSrc,
  getStorageClient,
}: HandleDeleteArgs): HandleDelete => {
  return async ({ doc: { mimeType, prefix = '' }, filename }) => {
    const publicId = path.posix.join(folderSrc, prefix, filename)
    const isVideo = mimeType.includes('video')

    await getStorageClient().uploader.destroy(publicId, {
      resource_type: isVideo ? 'video' : 'image',
    })
  }
}
