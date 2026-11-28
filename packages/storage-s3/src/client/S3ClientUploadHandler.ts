'use client'
import type { ClientUploadContext } from '@payloadcms/plugin-cloud-storage/types'

import {
  createClientUploadHandler,
  getClientUploadErrorMessage,
} from '@payloadcms/plugin-cloud-storage/client'
import { formatAdminURL } from 'payload/shared'

export const S3ClientUploadHandler = createClientUploadHandler({
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

    // get the signed URL from the server
    const response = await fetch(endpointRoute, {
      body: JSON.stringify({
        collectionSlug,
        docPrefix,
        filename: file.name,
        filesize: file.size,
        mimeType: file.type,
      }),
      credentials: 'include',
      method: 'POST',
    })

    if (!response.ok) {
      throw new Error(await getClientUploadErrorMessage(response, 'Failed to retrieve signed URL'))
    }

    const {
      clientUploadContext,
      filename: sanitizedFilename,
      headers,
      url,
    } = (await response.json()) as {
      clientUploadContext: ClientUploadContext
      filename?: string
      headers: Record<string, string>
      url: string
    }

    if (sanitizedFilename && sanitizedFilename !== file.name) {
      updateFilename(sanitizedFilename)
    }

    // upload the file directly to S3 using the signed URL
    const upload = await fetch(url, {
      body: file,
      headers,
      method: 'PUT',
    })

    if (!upload.ok) {
      throw new Error(`Upload failed with status ${upload.status}`)
    }

    // Return the server-issued upload context for the document request.
    return { prefix: clientUploadContext.prefix, signedReceipt: clientUploadContext.signedReceipt }
  },
})
