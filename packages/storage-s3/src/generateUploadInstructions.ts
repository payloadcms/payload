import type { S3 } from '@aws-sdk/client-s3'
import type { GenerateUploadInstructions } from 'payload'

import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { resolveSignedURLKey } from '@payloadcms/plugin-cloud-storage/utilities'

interface Args {
  acl?: 'private' | 'public-read'
  bucket: string
  collectionPrefix: string
  getStorageClient: () => S3
  useCompositePrefixes?: boolean
}

export const generateUploadInstructions = ({
  acl,
  bucket,
  collectionPrefix,
  getStorageClient,
  useCompositePrefixes = false,
}: Args): GenerateUploadInstructions => {
  return async ({ collectionSlug, docPrefix, filename, filesize, mimeType, req }) => {
    let filesizeLimit = req.payload.config.upload.limits?.fileSize

    if (filesizeLimit === Infinity) {
      filesizeLimit = undefined
    }

    const { fileKey, sanitizedDocPrefix, sanitizedFilename } = await resolveSignedURLKey({
      collectionPrefix,
      collectionSlug,
      docPrefix,
      filename,
      req,
      useCompositePrefixes,
    })

    const signableHeaders = new Set<string>()

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
        directUpload: { prefix: sanitizedDocPrefix },
        filename: sanitizedFilename,
        mimeType,
        size: filesize,
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
