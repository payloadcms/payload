import type { Storage } from '@google-cloud/storage'
import type { ClientUploadsAccess } from '@payloadcms/plugin-cloud-storage/types'
import type { PayloadHandler } from 'payload'

import { getFileKey } from '@payloadcms/plugin-cloud-storage/utilities'
import { APIError, Forbidden } from 'payload'

import type { GcsStorageOptions } from './index.js'

interface Args {
  access?: ClientUploadsAccess
  acl?: 'private' | 'public-read'
  bucket: string
  collections: GcsStorageOptions['collections']
  getStorageClient: () => Storage
  useCompositePrefixes?: boolean
}

const defaultAccess: Args['access'] = ({ req }) => !!req.user

export const getGenerateSignedURLHandler = ({
  access = defaultAccess,
  bucket,
  collections,
  getStorageClient,
  useCompositePrefixes = false,
}: Args): PayloadHandler => {
  return async (req) => {
    if (!req.json) {
      throw new APIError('Unreachable')
    }

    const { collectionSlug, docPrefix, filename, mimeType } = (await req.json()) as {
      collectionSlug: string
      docPrefix?: string
      filename: string
      mimeType: string
    }

    const collectionStorageConfig = collections[collectionSlug]
    if (!collectionStorageConfig) {
      throw new APIError(`Collection ${collectionSlug} was not found in GCS storage options`)
    }

    const collectionPrefix =
      (typeof collectionStorageConfig === 'object' && collectionStorageConfig.prefix) || ''

    if (!(await access({ collectionSlug, req }))) {
      throw new Forbidden()
    }

    const { fileKey, sanitizedDocPrefix } = getFileKey({
      collectionPrefix,
      docPrefix,
      filename,
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

    return Response.json({
      docPrefix: sanitizedDocPrefix,
      url,
    })
  }
}
