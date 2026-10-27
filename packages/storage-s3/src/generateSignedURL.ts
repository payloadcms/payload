import type { ClientUploadsAccess } from '@payloadcms/plugin-cloud-storage/types'
import type { PayloadHandler } from 'payload'

import * as AWS from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { resolveSignedURLKey } from '@payloadcms/plugin-cloud-storage/utilities'
import { APIError, Forbidden } from 'payload'
import {
  assertClientUploadAccess,
  assertClientUploadAllowed,
  assertClientUploadFileSize,
} from 'payload/internal'

import type { S3StorageOptions } from './index.js'

const bytesToMB = (bytes: number) => {
  return bytes / 1024 / 1024
}

interface Args {
  access?: ClientUploadsAccess
  acl?: 'private' | 'public-read'
  bucket: string
  collections: S3StorageOptions['collections']
  getStorageClient: () => AWS.S3
  useCompositePrefixes?: boolean
}

const defaultAccess: Args['access'] = ({ req }) => !!req.user

export const getGenerateSignedURLHandler = ({
  access = defaultAccess,
  acl,
  bucket,
  collections,
  getStorageClient,
  useCompositePrefixes = false,
}: Args): PayloadHandler => {
  return async (req) => {
    if (!req.json) {
      throw new APIError('Content-Type expected to be application/json', 400)
    }

    let filesizeLimit = req.payload.config.upload.limits?.fileSize

    if (filesizeLimit === Infinity) {
      filesizeLimit = undefined
    }

    const { collectionSlug, docPrefix, filename, filesize, mimeType } = (await req.json()) as {
      collectionSlug: string
      docPrefix?: string
      filename: string
      filesize: number
      mimeType: string
    }

    await assertClientUploadAccess({ collectionSlug, req })

    const collectionS3Config = collections[collectionSlug]
    if (!collectionS3Config) {
      throw new APIError(`Collection ${collectionSlug} was not found in S3 options`)
    }

    const collectionPrefix =
      (typeof collectionS3Config === 'object' && collectionS3Config.prefix) || ''

    if (!(await access({ collectionSlug, req }))) {
      throw new Forbidden()
    }

    assertClientUploadAllowed({
      collection: req.payload.collections[collectionSlug]?.config,
      filename,
      mimeType,
    })

    const { clientUploadContext, fileKey, sanitizedDocPrefix, sanitizedFilename } =
      await resolveSignedURLKey({
        collectionPrefix,
        collectionSlug,
        docPrefix,
        filename,
        req,
        useCompositePrefixes,
      })

    const signableHeaders = new Set<string>()

    if (typeof mimeType === 'string' && mimeType) {
      signableHeaders.add('content-type')
    }

    if (filesizeLimit) {
      assertClientUploadFileSize(filesize)

      if (filesize > filesizeLimit) {
        throw new APIError(
          `Exceeded file size limit. Limit: ${bytesToMB(filesizeLimit).toFixed(2)}MB, got: ${bytesToMB(filesize).toFixed(2)}MB`,
          400,
        )
      }

      // Still force S3 to validate
      signableHeaders.add('content-length')
    }

    const url = await getSignedUrl(
      getStorageClient(),
      new AWS.PutObjectCommand({
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

    return Response.json({
      clientUploadContext,
      docPrefix: sanitizedDocPrefix,
      filename: sanitizedFilename,
      headers: {
        'Content-Length': String(filesize),
        'Content-Type': mimeType,
        'If-None-Match': '*',
      },
      url,
    })
  }
}
