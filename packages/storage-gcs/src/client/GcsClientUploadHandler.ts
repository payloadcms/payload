'use client'
import type { ClientUploadContext } from '@payloadcms/plugin-cloud-storage/types'

import { createClientUploadHandler } from '@payloadcms/plugin-cloud-storage/client'
import { formatAdminURL } from 'payload/shared'

export const GcsClientUploadHandler = createClientUploadHandler({
  handler: async ({
    apiRoute,
    collectionSlug,
    docPrefix,
    file,
    serverHandlerPath,
    serverURL,
    updateFilename,
  }): Promise<ClientUploadContext> => {
    const endpointRoute = formatAdminURL({
      apiRoute,
      path: serverHandlerPath,
      serverURL,
    })
    const response = await fetch(endpointRoute, {
      body: JSON.stringify({
        collectionSlug,
        docPrefix,
        filename: file.name,
        mimeType: file.type,
      }),
      credentials: 'include',
      method: 'POST',
    })

    const {
      clientUploadContext,
      filename: sanitizedFilename,
      headers: extraHeaders,
      url,
    } = (await response.json()) as {
      clientUploadContext: ClientUploadContext
      filename?: string
      headers?: Record<string, string>
      url: string
    }

    if (sanitizedFilename && sanitizedFilename !== file.name) {
      updateFilename(sanitizedFilename)
    }

    const upload = await fetch(url, {
      body: file,
      headers: {
        'Content-Length': file.size.toString(),
        'Content-Type': file.type,
        ...extraHeaders,
      },
      method: 'PUT',
    })

    if (!upload.ok) {
      throw new Error('Failed to upload file to Google Cloud Storage')
    }

    return { prefix: clientUploadContext.prefix, signedReceipt: clientUploadContext.signedReceipt }
  },
})
