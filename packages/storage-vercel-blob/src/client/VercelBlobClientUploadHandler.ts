'use client'
import { createClientUploadHandler } from '@payloadcms/plugin-cloud-storage/client'
import { upload } from '@vercel/blob/client'

export type VercelBlobClientUploadHandlerExtra = {
  addRandomSuffix: boolean
  baseURL: string
  prefix: string
}

export const VercelBlobClientUploadHandler =
  createClientUploadHandler<VercelBlobClientUploadHandlerExtra>({
    handler: async ({
      apiRoute,
      collectionSlug,
      extra: { addRandomSuffix, baseURL, prefix = '' },
      file,
      serverHandlerPath,
      serverURL,
      updateFilename,
    }) => {
      const result = await upload(`${prefix}${file.name}`, file, {
        access: 'public',
        clientPayload: collectionSlug,
        contentType: file.type,
        handleUploadUrl: `${serverURL}${apiRoute}${serverHandlerPath}`,
      })

      // Update filename with suffix from returned url
      if (addRandomSuffix) {
        updateFilename(result.url.replace(`${baseURL}/`, ''))
      }
    },
  })
