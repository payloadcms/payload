import type { ContainerClient, StorageSharedKeyCredential } from '@azure/storage-blob'
import type { ClientUploadsAccess } from '@payloadcms/plugin-cloud-storage/types'
import type { PayloadHandler } from 'payload'

import { BlobSASPermissions, generateBlobSASQueryParameters } from '@azure/storage-blob'
import { joinPrefixes } from '@payloadcms/plugin-cloud-storage/utilities'
import path from 'path'
import { APIError, Forbidden } from 'payload'
import { sanitizeFilename } from 'payload/shared'

import type { AzureStorageOptions } from './index.js'

interface Args {
  access?: ClientUploadsAccess
  basePrefix?: string
  collections: AzureStorageOptions['collections']
  containerName: string
  getStorageClient: () => ContainerClient
}

const defaultAccess: Args['access'] = ({ req }) => !!req.user

export const getGenerateSignedURLHandler = ({
  access = defaultAccess,
  basePrefix,
  collections,
  containerName,
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

    const collectionAzureConfig = collections[collectionSlug]
    if (!collectionAzureConfig) {
      throw new APIError(`Collection ${collectionSlug} was not found in Azure options`)
    }

    const prefix = (typeof collectionAzureConfig === 'object' && collectionAzureConfig.prefix) || ''

    if (!(await access({ collectionSlug, req }))) {
      throw new Forbidden()
    }

    const sanitizedFilename = sanitizeFilename(filename)
    const fileKey = path.posix.join(joinPrefixes(basePrefix, prefix), sanitizedFilename)

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
