'use client'
import { createClientUploadHandler } from '@payloadcms/plugin-cloud-storage/client'
import { formatAdminURL } from 'payload/shared'

export const GcsClientUploadHandler = createClientUploadHandler({
  handler: async ({ apiRoute, collectionSlug, file, prefix, serverHandlerPath, serverURL }) => {
    const endpointRoute = formatAdminURL({
      apiRoute,
      path: serverHandlerPath,
      serverURL,
    })
    const response = await fetch(endpointRoute, {
      body: JSON.stringify({
        collectionSlug,
        filename: file.name,
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
