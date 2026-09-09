import type { Storage } from '@google-cloud/storage'
import type { GenerateUploadInstructions, UploadInstructionsAccess } from 'payload'

import { resolveSignedURLKey } from '@payloadcms/plugin-cloud-storage/utilities'
import { Forbidden } from 'payload'
import { assertClientUploadAllowed } from 'payload/internal'

interface Args {
  access?: UploadInstructionsAccess
  bucket: string
  collectionPrefix: string
  getStorageClient: () => Storage
  useCompositePrefixes?: boolean
}

const createOnlyHeaders = {
  'x-goog-if-generation-match': '0',
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

    assertClientUploadAllowed({
      collection: req.payload.collections[collectionSlug]?.config,
      filename,
      mimeType,
    })
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
        extensionHeaders: createOnlyHeaders,
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
          ...createOnlyHeaders,
        },
        method: 'PUT',
        url,
      },
    }
  }
}
