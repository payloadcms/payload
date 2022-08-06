import type { CollectionConfig } from 'payload/types'
import { BlobServiceClient } from '@azure/storage-blob'
import type { HandleDelete } from '../../types'

interface Args {
  collection: CollectionConfig
  connectionString: string
  containerName: string
  baseURL: string
}

export const getHandleDelete = ({ connectionString, containerName }: Args): HandleDelete => {
  const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString)
  const containerClient = blobServiceClient.getContainerClient(containerName)

  return async ({ filename }) => {
    const blockBlobClient = containerClient.getBlockBlobClient(filename)
    await blockBlobClient.deleteIfExists()
  }
}
