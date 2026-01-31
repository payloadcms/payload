'use client'
import { createClientUploadHandler } from '@payloadcms/plugin-cloud-storage/client'
import { formatAdminURL } from 'payload/shared'
import sanitize from 'sanitize-filename'

function getSafeFilename(name: string): string {
  const base = sanitize(name.substring(0, name.lastIndexOf('.')) || name)
  const ext = name.includes('.') ? name.split('.').pop()?.split('?')[0] : ''
  return ext ? `${base}.${ext}` : base
}

export const GcsClientUploadHandler = createClientUploadHandler({
  handler: async ({
    apiRoute,
    collectionSlug,
    file,
    prefix,
    serverHandlerPath,
    serverURL,
    updateFilename,
  }) => {
    const safeFilename = getSafeFilename(file.name)
    updateFilename(safeFilename)

    const endpointRoute = formatAdminURL({
      apiRoute,
      path: serverHandlerPath,
      serverURL,
    })
    const response = await fetch(endpointRoute, {
      body: JSON.stringify({
        collectionSlug,
        filename: safeFilename,
        mimeType: file.type,
      }),
      credentials: 'include',
      method: 'POST',
    })

    const { url } = (await response.json()) as { url: string }

    await fetch(url, {
      body: file,
      headers: { 'Content-Length': file.size.toString(), 'Content-Type': file.type },
      method: 'PUT',
    })

    return {
      prefix,
    }
  },
})
