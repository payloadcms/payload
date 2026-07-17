import type { Storage } from '@google-cloud/storage'
import type { GenerateUploadInstructions, UploadInstructionsAccess } from 'payload'

import { resolveSignedURLKey } from '@payloadcms/plugin-cloud-storage/utilities'
import { Forbidden } from 'payload'

interface Args {
  access?: UploadInstructionsAccess
  bucket: string
  collectionPrefix: string
  getStorageClient: () => Storage
  useCompositePrefixes?: boolean
}

export const generateUploadInstructions = ({
  access,
  bucket,
  collectionPrefix,
  getStorageClient,
  useCompositePrefixes = false,
}: Args): GenerateUploadInstructions => {
  return async ({
    collectionSlug,
    docPrefix,
    filename,
    filesize,
    mimeType,
    overrideAccess,
    req,
  }) => {
    if (!overrideAccess && (access ? !(await access({ collectionSlug, req })) : !req.user)) {
      throw new Forbidden(req.t)
    }

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
      file: {
        filename: sanitizedFilename,
        mimeType,
        size: filesize,
        uploadReference: { prefix: sanitizedDocPrefix },
      },
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
