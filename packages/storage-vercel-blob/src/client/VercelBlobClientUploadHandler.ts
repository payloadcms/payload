'use client'
import { createClientUploadHandler } from '@payloadcms/plugin-cloud-storage/client'
import { put } from '@vercel/blob/client'

export const VercelBlobClientUploadHandler = createClientUploadHandler({
  name: 'uploadToVercelBlob',
  handler: async ({ data, file, onProgress }) => {
    const { pathname, token } = data as { pathname: string; token: string }
    let loadedBytes = 0

    const result = await put(pathname, file, {
      access: 'public',
      contentType: file.type,
      // Multipart uploads report parts as they finish, so the total never goes backwards.
      onUploadProgress: ({ loaded }) => {
        loadedBytes = Math.max(loadedBytes, Math.min(loaded, file.size))
        onProgress({ loadedBytes, totalBytes: file.size })
      },
      token,
    })

    if (decodeURIComponent(result.pathname) !== decodeURIComponent(pathname)) {
      throw new Error('The uploaded file was stored at an unexpected location')
    }
  },
})
