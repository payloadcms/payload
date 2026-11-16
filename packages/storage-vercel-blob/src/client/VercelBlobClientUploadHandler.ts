'use client'
import type { ClientUploadContext } from '@payloadcms/plugin-cloud-storage/types'

import { createClientUploadHandler } from '@payloadcms/plugin-cloud-storage/client'
import { upload } from '@vercel/blob/client'
import { formatAdminURL } from 'payload/shared'

export type VercelBlobClientUploadHandlerExtra = {
  addRandomSuffix: boolean
  useCompositePrefixes: boolean
}

export const VercelBlobClientUploadHandler =
  createClientUploadHandler<VercelBlobClientUploadHandlerExtra>({
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
      const issued = await fetch(`${endpointRoute}?issue-client-upload=1`, {
        body: JSON.stringify({
          collectionSlug,
          docPrefix,
          filename: file.name,
          mimeType: file.type,
        }),
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })
      if (!issued.ok) {
        throw new Error('Failed to initialize Vercel Blob client upload')
      }

      const { clientUploadContext, filename, pathname } = (await issued.json()) as {
        clientUploadContext: ClientUploadContext
        filename: string
        pathname: string
      }
      updateFilename(filename)

      await upload(pathname, file, {
        access: 'public',
        clientPayload: JSON.stringify({
          collectionSlug,
          mimeType: file.type,
          signedReceipt: clientUploadContext.signedReceipt,
        }),
        contentType: file.type,
        handleUploadUrl: endpointRoute,
      })

      return {
        prefix: clientUploadContext.prefix,
        signedReceipt: clientUploadContext.signedReceipt,
      }
    },
  })
