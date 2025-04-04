import type { ContainerClient } from '@azure/storage-blob'

import { BlobServiceClient } from '@azure/storage-blob'

import type { AzureStorageOptions } from '../index.js'

let storageClient: ContainerClient | null = null

export function getStorageClient(
  options: Pick<
    AzureStorageOptions,
    'baseURL' | 'connectionString' | 'containerName' | 'credential'
  >,
): ContainerClient {
  if (storageClient) {
    return storageClient
  }

  const { baseURL, connectionString, containerName, credential } = options
  let blobServiceClient: BlobServiceClient | undefined = undefined
  if (typeof connectionString === 'string') {
    blobServiceClient = BlobServiceClient.fromConnectionString(connectionString)
  } else if (typeof credential === 'object' && baseURL) {
    blobServiceClient = new BlobServiceClient(baseURL, credential, {})
  } else {
    throw new Error('connectionString or credential with baseURL must be provided')
  }
  storageClient = blobServiceClient.getContainerClient(containerName)
  return storageClient
}
