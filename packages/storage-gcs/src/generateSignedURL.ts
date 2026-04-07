import type { Storage } from '@google-cloud/storage'
import type { ClientUploadsAccess } from '@payloadcms/plugin-cloud-storage/types'
import type { PayloadHandler } from 'payload'

import { joinPrefixes } from '@payloadcms/plugin-cloud-storage/utilities'
import path from 'path'
import { APIError, Forbidden } from 'payload'
import { sanitizeFilename } from 'payload/shared'

import type { GcsStorageOptions } from './index.js'

interface Args {
  access?: ClientUploadsAccess
  acl?: 'private' | 'public-read'
  basePrefix?: string
  bucket: string
  collections: GcsStorageOptions['collections']
  getStorageClient: () => Storage
}

const defaultAccess: Args['access'] = ({ req }) => !!req.user

export const getGenerateSignedURLHandler = ({
  access = defaultAccess,
  basePrefix,
  bucket,
  collections,
  getStorageClient,
}: Args): PayloadHandler => {
  return async (req) => {
    if (!req.json) {
      throw new APIError('Unreachable')
    }

    const { collectionSlug, filename, mimeType } = (await req.json()) as {
      collectionSlug: string
      filename: string
      mimeType: string
    }

    const collectionGcsConfig = collections[collectionSlug]
    if (!collectionGcsConfig) {
      throw new APIError(`Collection ${collectionSlug} was not found in GCS options`)
    }

    const prefix = (typeof collectionGcsConfig === 'object' && collectionGcsConfig.prefix) || ''

    if (!(await access({ collectionSlug, req }))) {
      throw new Forbidden()
    }

    const sanitizedFilename = sanitizeFilename(filename)
    const fileKey = path.posix.join(joinPrefixes(basePrefix, prefix), sanitizedFilename)

    const [url] = await getStorageClient()
      .bucket(bucket)
      .file(fileKey)
      .getSignedUrl({
        action: 'write',
        contentType: mimeType,
        expires: Date.now() + 60 * 60 * 5,
        version: 'v4',
      })

    return Response.json({ url })
  }
}
