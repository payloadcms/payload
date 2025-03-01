import type { ContainerClient, StorageSharedKeyCredential } from '@azure/storage-blob'
import type { ClientUploadsAccess } from '@payloadcms/plugin-cloud-storage/types'
import type { PayloadHandler } from 'payload'

import { BlobSASPermissions, generateBlobSASQueryParameters } from '@azure/storage-blob'
import path from 'path'
import { APIError, Forbidden } from 'payload'

import type { AzureStorageOptions } from './index.js'

interface Args {
  access?: ClientUploadsAccess
  collections: AzureStorageOptions['collections']
  containerName: string
  getStorageClient: () => ContainerClient
}

const defaultAccess: Args['access'] = ({ req }) => !!req.user

export const getGenerateSignedURLHandler = ({
  access = defaultAccess,
  collections,
  containerName,
  getStorageClient,
}: Args): PayloadHandler => {
  return async (req) => {
    if (!req.json) {
      throw new APIError('Unreachable')
    }

    const { collectionSlug, filename, mimeType } = await req.json()

    const collectionS3Config = collections[collectionSlug]
    if (!collectionS3Config) {
      throw new APIError(`Collection ${collectionSlug} was not found in S3 options`)
    }

    const prefix = (typeof collectionS3Config === 'object' && collectionS3Config.prefix) || ''

    if (!(await access({ collectionSlug, req }))) {
      throw new Forbidden()
    }

    const fileKey = path.posix.join(prefix, filename)

    const blobClient = getStorageClient().getBlobClient(fileKey)

    const sasToken = generateBlobSASQueryParameters(
      {
        blobName: fileKey,
        containerName,
        contentType: mimeType,
        expiresOn: new Date(Date.now() + 30 * 60 * 1000),
        permissions: BlobSASPermissions.parse('w'),
        startsOn: new Date(),
      },
      getStorageClient().credential as StorageSharedKeyCredential,
    )

    return Response.json({ url: `${blobClient.url}?${sasToken.toString()}` })
  }
}
