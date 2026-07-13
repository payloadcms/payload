import type { ContainerClient, StorageSharedKeyCredential } from '@azure/storage-blob'
import type { GenerateUploadInstructions } from 'payload'

import { BlobSASPermissions, generateBlobSASQueryParameters } from '@azure/storage-blob'
import { resolveSignedURLKey } from '@payloadcms/plugin-cloud-storage/utilities'

interface Args {
  collectionPrefix: string
  containerName: string
  getStorageClient: () => ContainerClient
  useCompositePrefixes?: boolean
}

export const generateUploadInstructions = ({
  collectionPrefix,
  containerName,
  getStorageClient,
  useCompositePrefixes = false,
}: Args): GenerateUploadInstructions => {
  return async ({ collectionSlug, docPrefix, filename, filesize, mimeType, req }) => {
    const { fileKey, sanitizedDocPrefix, sanitizedFilename } = await resolveSignedURLKey({
      collectionPrefix,
      collectionSlug,
      docPrefix,
      filename,
      req,
      useCompositePrefixes,
    })

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

    return {
      type: 'http',
      clientUploadContext: { prefix: sanitizedDocPrefix },
      filename: sanitizedFilename,
      request: {
        headers: {
          'Content-Length': String(filesize),
          'Content-Type': mimeType,
          'x-ms-blob-type': 'BlockBlob',
        },
        method: 'PUT',
        url: `${blobClient.url}?${sasToken.toString()}`,
      },
    }
  }
}
