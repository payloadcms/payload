import type { S3 } from '@aws-sdk/client-s3'
import type { GenerateUploadInstructions, UploadInstructionsAccess } from 'payload'

import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { resolveSignedURLKey } from '@payloadcms/plugin-cloud-storage/utilities'
import { Forbidden } from 'payload'
import { assertClientUploadAllowed } from 'payload/internal'

interface Args {
  access?: UploadInstructionsAccess
  acl?: 'private' | 'public-read'
  bucket: string
  collectionPrefix: string
  getStorageClient: () => S3
  useCompositePrefixes?: boolean
}

export const generateUploadInstructions = ({
  access,
  acl,
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
    let filesizeLimit = req.payload.config.upload.limits?.fileSize

    if (filesizeLimit === Infinity) {
      filesizeLimit = undefined
    }

    const { fileKey, sanitizedFilename, uploadReference } = await resolveSignedURLKey({
      collectionPrefix,
      collectionSlug,
      docPrefix,
      filename,
      req,
      useCompositePrefixes,
    })

    const signableHeaders = new Set<string>(['content-type'])

    if (filesizeLimit) {
      // Still force S3 to validate
      signableHeaders.add('content-length')
    }

    const url = await getSignedUrl(
      getStorageClient(),
      new PutObjectCommand({
        ACL: acl,
        Bucket: bucket,
        ContentLength: filesizeLimit ? Math.min(filesize, filesizeLimit) : undefined,
        ContentType: mimeType,
        IfNoneMatch: '*',
        Key: fileKey,
      }),
      {
        expiresIn: 600,
        signableHeaders,
      },
    )

    return {
      type: 'http',
      file: {
        filename: sanitizedFilename,
        mimeType,
        size: filesize,
        uploadReference,
      },
      request: {
        headers: {
          'Content-Length': String(filesize),
          'Content-Type': mimeType,
          'If-None-Match': '*',
        },
        method: 'PUT',
        url,
      },
    }
  }
}
