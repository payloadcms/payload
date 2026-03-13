import type { ContainerClient } from '@azure/storage-blob'

import { BlobServiceClient } from '@azure/storage-blob'

import type { AzureStorageOptions } from '../index.js'

// Cache the Azure Blob storage clients in a map so that multiple instances are not overriding each other in the case of different configurations used per collection
const azureClients = new Map<string, ContainerClient>()

export function getStorageClient(
  options: Pick<
    AzureStorageOptions,
    'baseURL' | 'clientCacheKey' | 'connectionString' | 'containerName' | 'credentials'
  >,
): ContainerClient {
  const cacheKey = options.clientCacheKey || `azure:${options.containerName}`

  if (azureClients.has(cacheKey)) {
    return azureClients.get(cacheKey)!
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

  azureClients.set(cacheKey, blobServiceClient.getContainerClient(containerName))

  return azureClients.get(cacheKey)!
}
