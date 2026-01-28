'use client'
import { createClientUploadHandler } from '@payloadcms/plugin-cloud-storage/client'
import { toast } from '@payloadcms/ui'
import { formatAdminURL } from 'payload/shared'

export const S3ClientUploadHandler = createClientUploadHandler({
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
        filesize: file.size,
        mimeType: file.type,
      }),
      credentials: 'include',
      method: 'POST',
    })

    if (!response.ok) {
      const { errors } = (await response.json()) as {
        errors: { message: string }[]
      }

      throw new Error(errors.reduce((acc, err) => `${acc ? `${acc}, ` : ''}${err.message}`, ''))
    }

    const { url } = (await response.json()) as {
      url: string
    }

    await fetch(url, {
      body: file,
      headers: { 'Content-Length': file.size.toString(), 'Content-Type': file.type },
      method: 'PUT',
    })

    return { prefix }
  },
})
