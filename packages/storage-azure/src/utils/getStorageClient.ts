import type { ContainerClient } from '@azure/storage-blob'

import { BlobServiceClient } from '@azure/storage-blob'

import type { AzureStorageOptions } from '../index.js'

let storageClient: ContainerClient | null = null

export function getStorageClient(
  options: Pick<
    AzureStorageOptions,
    'baseURL' | 'connectionString' | 'containerName' | 'credentials'
  >,
): ContainerClient {
  if (storageClient) {
    return storageClient
  }

  const { baseURL, connectionString, containerName, credentials } = options

  let blobServiceClient: BlobServiceClient

  if (credentials) {
    blobServiceClient = new BlobServiceClient(baseURL, credentials)
  } else if (connectionString) {
    blobServiceClient = BlobServiceClient.fromConnectionString(connectionString)
  } else {
    throw new Error(
      'Azure Storage: Either provide a connectionString or credentials for authentication',
    )
  }

  storageClient = blobServiceClient.getContainerClient(containerName)
  return storageClient
}
