'use client'
import type { OnUploadProgress } from 'payload'

import { put } from '@vercel/blob/client'

type HandleVercelBlobUploadArgs = {
  data?: unknown
  file: File
  onProgress?: OnUploadProgress
}

/** Sends a file to Vercel Blob with the client token from the upload instructions. */
export const handleVercelBlobUpload = async ({
  data,
  file,
  onProgress,
}: HandleVercelBlobUploadArgs): Promise<void> => {
  const { pathname, token } = data as { pathname: string; token: string }
  let loadedBytes = 0

  const result = await put(pathname, file, {
    access: 'public',
    contentType: file.type,
    // Multipart uploads report parts as they finish, so the total never goes backwards.
    onUploadProgress: ({ loaded }) => {
      loadedBytes = Math.max(loadedBytes, Math.min(loaded, file.size))
      onProgress?.({ loadedBytes, totalBytes: file.size })
    },
    token,
  })

  if (decodeURIComponent(result.pathname) !== decodeURIComponent(pathname)) {
    throw new Error('The uploaded file was stored at an unexpected location')
  }
}
