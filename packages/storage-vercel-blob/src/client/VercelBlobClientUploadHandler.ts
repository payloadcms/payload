'use client'
import { createClientUploadHandler } from '@payloadcms/plugin-cloud-storage/client'
import { put } from '@vercel/blob/client'

export const VercelBlobClientUploadHandler = createClientUploadHandler({
  name: 'uploadToVercelBlob',
  handler: async ({ data, file }) => {
    const { pathname, token } = data as { pathname: string; token: string }

    const result = await put(pathname, file, {
      access: 'public',
      contentType: file.type,
      token,
    })

    if (decodeURIComponent(result.pathname) !== decodeURIComponent(pathname)) {
      throw new Error('The uploaded file was stored at an unexpected location')
    }
  },
})
