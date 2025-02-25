'use client'
import { createClientUploadHandler } from '@payloadcms/plugin-cloud-storage/client'

export const AzureClientUploadHandler = createClientUploadHandler({
  handler: async ({ apiRoute, collectionSlug, file, serverURL }) => {
    const response = await fetch(`${serverURL}${apiRoute}/storage-azure-generate-signed-url`, {
      body: JSON.stringify({
        collectionSlug,
        filename: file.name,
        mimeType: file.type,
      }),
      credentials: 'include',
      method: 'POST',
    })

    const { url } = await response.json()

    await fetch(url, {
      body: file,
      headers: {
        'Content-Length': file.size.toString(),
        'Content-Type': file.type,
        // requried for azure
        'x-ms-blob-type': 'BlockBlob',
      },
      method: 'PUT',
    })
  },
})
