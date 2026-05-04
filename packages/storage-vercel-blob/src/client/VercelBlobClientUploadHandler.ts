'use client'
import { createClientUploadHandler } from '@payloadcms/plugin-cloud-storage/client'
import { getFileKey } from '@payloadcms/plugin-cloud-storage/utilities'
import { upload } from '@vercel/blob/client'
import { formatAdminURL } from 'payload/shared'

export type VercelBlobClientUploadHandlerExtra = {
  addRandomSuffix: boolean
  useCompositePrefixes: boolean
}

/** Last path segment only (POSIX), for keys like `folder/sub/file.png`. */
function posixBasename(key: string): string {
  const normalized = key.replace(/^\/+/, '')
  const lastSlash = normalized.lastIndexOf('/')
  return lastSlash === -1 ? normalized : normalized.slice(lastSlash + 1)
}

export const VercelBlobClientUploadHandler =
  createClientUploadHandler<VercelBlobClientUploadHandlerExtra>({
    handler: async ({
      apiRoute,
      collectionSlug,
      docPrefix,
      extra: { addRandomSuffix, useCompositePrefixes = false },
      file,
      prefix,
      serverHandlerPath,
      serverURL,
      updateFilename,
    }) => {
      const endpointRoute = formatAdminURL({
        apiRoute,
        path: serverHandlerPath,
        serverURL,
      })
      const { fileKey: pathname, sanitizedDocPrefix } = getFileKey({
        collectionPrefix: prefix,
        docPrefix,
        filename: file.name,
        useCompositePrefixes,
      })

      // upload the file directly to Vercel Blob using the signed URL
      const result = await upload(pathname, file, {
        access: 'public',
        clientPayload: collectionSlug,
        contentType: file.type,
        handleUploadUrl: endpointRoute,
      })

      // Match server uploadFile: document `filename` is basename only; prefixes are separate.
      if (addRandomSuffix) {
        const pathname = result.pathname.replace(/^\/+/, '')
        updateFilename(decodeURIComponent(posixBasename(pathname)))
      }

      return { prefix: sanitizedDocPrefix }
    },
  })
