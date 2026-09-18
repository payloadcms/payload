'use client'
import { createClientUploadHandler } from '@payloadcms/plugin-cloud-storage/client'
import { put } from '@vercel/blob/client'

/** Last path segment only (POSIX), for keys like `folder/sub/file.png`. */
function posixBasename(key: string): string {
  const normalized = key.replace(/^\/+/, '')
  const lastSlash = normalized.lastIndexOf('/')
  return lastSlash === -1 ? normalized : normalized.slice(lastSlash + 1)
}

export const VercelBlobClientUploadHandler = createClientUploadHandler({
  name: 'uploadToVercelBlob',
  handler: async ({ data, file, updateFilename }) => {
    const { pathname, token } = data as { pathname: string; token: string }

    const result = await put(pathname, file, {
      access: 'public',
      contentType: file.type,
      token,
    })

    const filename = decodeURIComponent(posixBasename(result.pathname.replace(/^\/+/, '')))
    if (filename !== file.name) {
      updateFilename(filename)
    }
  },
})
