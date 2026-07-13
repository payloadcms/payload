import type { Storage } from '@google-cloud/storage'
import type { GenerateUploadInstructions } from 'payload'

import { resolveSignedURLKey } from '@payloadcms/plugin-cloud-storage/utilities'

interface Args {
  bucket: string
  collectionPrefix: string
  getStorageClient: () => Storage
  useCompositePrefixes?: boolean
}

export const generateUploadInstructions = ({
  bucket,
  collectionPrefix,
  getStorageClient,
  useCompositePrefixes = false,
}: Args): GenerateUploadInstructions => {
  return async ({ collectionSlug, docPrefix, filename, filesize, mimeType, req }) => {
    const { fileKey, sanitizedDocPrefix, sanitizedFilename } = await resolveSignedURLKey({
      collectionPrefix,
      collectionSlug,
      docPrefix,
      filename,
      req,
      useCompositePrefixes,
    })

    const [url] = await getStorageClient()
      .bucket(bucket)
      .file(fileKey)
      .getSignedUrl({
        action: 'write',
        contentType: mimeType,
        expires: Date.now() + 60 * 60 * 5,
        version: 'v4',
      })

    return {
      type: 'http',
      clientUploadContext: { prefix: sanitizedDocPrefix },
      filename: sanitizedFilename,
      request: {
        headers: {
          'Content-Length': String(filesize),
          'Content-Type': mimeType,
        },
        method: 'PUT',
        url,
      },
    }
  }
}
