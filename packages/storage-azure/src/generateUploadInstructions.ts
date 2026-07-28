import type { ContainerClient, StorageSharedKeyCredential } from '@azure/storage-blob'
import type { GenerateUploadInstructions, UploadInstructionsAccess } from 'payload'

import { BlobSASPermissions, generateBlobSASQueryParameters } from '@azure/storage-blob'
import { resolveSignedURLKey } from '@payloadcms/plugin-cloud-storage/utilities'
import { Forbidden } from 'payload'

interface Args {
  access?: UploadInstructionsAccess
  collectionPrefix: string
  containerName: string
  getStorageClient: () => ContainerClient
  useCompositePrefixes?: boolean
}

export const generateUploadInstructions = ({
  access,
  collectionPrefix,
  containerName,
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
        expiresOn: new Date(Date.now() + 3 * 60 * 60 * 1000),
        permissions: BlobSASPermissions.parse('w'),
        startsOn: new Date(),
      },
      getStorageClient().credential as StorageSharedKeyCredential,
    )

    return {
      name: 'uploadToAzure',
      type: 'dispatch',
      data: {
        url: `${blobClient.url}?${sasToken.toString()}`,
      },
      file: {
        filename: sanitizedFilename,
        mimeType,
        size: filesize,
        uploadReference: { prefix: sanitizedDocPrefix },
      },
    }
  }
}
