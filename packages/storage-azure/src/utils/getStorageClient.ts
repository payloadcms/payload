import type { TokenCredential } from '@azure/core-auth'
import type { ContainerClient } from '@azure/storage-blob'

import { BlobServiceClient } from '@azure/storage-blob'

export type GetStorageClientOptions = {
  /**
   * Storage account blob endpoint, required when authenticating with `credential`
   */
  baseURL?: string
  clientCacheKey?: string
  connectionString?: string
  containerName: string
  credential?: TokenCredential
}

type AzureClients = {
  containerClient: ContainerClient
  serviceClient: BlobServiceClient
}

// Cache the Azure Blob storage clients in a map so that multiple instances are not overriding each other in the case of different configurations used per collection
const azureClients = new Map<string, AzureClients>()

export function getStorageClient(options: GetStorageClientOptions): ContainerClient {
  return resolveAzureClients(options).containerClient
}

export function getBlobServiceClient(options: GetStorageClientOptions): BlobServiceClient {
  return resolveAzureClients(options).serviceClient
}

function resolveAzureClients(options: GetStorageClientOptions): AzureClients {
  const cacheKey = options.clientCacheKey || `azure:${options.containerName}`

  const cachedClients = azureClients.get(cacheKey)

  if (cachedClients) {
    return cachedClients
  }

  const { baseURL, connectionString, containerName, credential } = options

  let serviceClient: BlobServiceClient

  if (connectionString) {
    serviceClient = BlobServiceClient.fromConnectionString(connectionString)
  } else if (credential) {
    if (!baseURL) {
      throw new Error(
        'Azure Blob storage: `baseURL` must be set to the storage account blob endpoint when authenticating with `credential`',
      )
    }

    serviceClient = new BlobServiceClient(baseURL, credential)
  } else {
    throw new Error(
      'Azure Blob storage: provide either `connectionString` or `credential` to authenticate',
    )
  }

  const clients: AzureClients = {
    containerClient: serviceClient.getContainerClient(containerName),
    serviceClient,
  }

  azureClients.set(cacheKey, clients)

  return clients
}
