import type { ContainerClient } from '@azure/storage-blob'

import { BlobServiceClient } from '@azure/storage-blob'

import type { AzureStorageOptions } from '../index.js'

let storageClient: ContainerClient | null = null

export function getStorageClient(
  options: Pick<AzureStorageOptions, 'connectionString' | 'containerName'>,
): ContainerClient {
  if (storageClient) {
    return storageClient
  }

  const { connectionString, containerName } = options

  const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString)
  storageClient = blobServiceClient.getContainerClient(containerName)
  return storageClient
}
