'use client'
import { createClientUploadHandler } from '@payloadcms/plugin-cloud-storage/client'
import { upload } from '@vercel/blob/client'

export const VercelBlobClientUploadHandler = createClientUploadHandler({
  handler: async ({
    addRandomSuffix,
    apiRoute,
    baseURL,
    collectionSlug,
    file,
    prefix = '',
    serverURL,
    updateFilename,
  }) => {
    const result = await upload(`${prefix}${file.name}`, file, {
      access: 'public',
      clientPayload: collectionSlug,
      contentType: file.type,
      handleUploadUrl: `${serverURL}${apiRoute}/vercel-blob-client-upload-route`,
    })

    // Update filename with suffix from returned url
    if (addRandomSuffix) {
      updateFilename(result.url.replace(`${baseURL}/`, ''))
    }
  },
})
