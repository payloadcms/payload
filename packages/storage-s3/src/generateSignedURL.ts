import type { ClientUploadsAccess } from '@ruya.sa/plugin-cloud-storage/types'
import type { PayloadHandler } from '@ruya.sa/payload'

import * as AWS from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import path from 'path'
import { APIError, Forbidden, ValidationError } from '@ruya.sa/payload'

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
}

const defaultAccess: Args['access'] = ({ req }) => !!req.user

export const getGenerateSignedURLHandler = ({
  access = defaultAccess,
  acl,
  bucket,
  collections,
  getStorageClient,
}: Args): PayloadHandler => {
  return async (req) => {
    if (!req.json) {
      throw new APIError('Content-Type expected to be application/json', 400)
    }

    let filesizeLimit = req.payload.config.upload.limits?.fileSize

    if (filesizeLimit === Infinity) {
      filesizeLimit = undefined
    }

    const { collectionSlug, filename, filesize, mimeType } = (await req.json()) as {
      collectionSlug: string
      filename: string
      filesize: number
      mimeType: string
    }

    const collectionS3Config = collections[collectionSlug]
    if (!collectionS3Config) {
      throw new APIError(`Collection ${collectionSlug} was not found in S3 options`)
    }

    const prefix = (typeof collectionS3Config === 'object' && collectionS3Config.prefix) || ''

    if (!(await access({ collectionSlug, req }))) {
      throw new Forbidden()
    }

    const fileKey = path.posix.join(prefix, filename)

    const signableHeaders = new Set<string>()

    if (filesizeLimit) {
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
        Key: fileKey,
      }),
      {
        expiresIn: 600,
        signableHeaders,
      },
    )

    return Response.json({ url })
  }
}
