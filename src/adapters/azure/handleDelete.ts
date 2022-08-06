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

  return async ({ doc }) => {
    const filesToDelete: string[] = [
      doc.filename,
      ...Object.values(doc?.sizes || []).map(resizedFileData => resizedFileData?.filename),
    ]

    for (const fileName of filesToDelete) {
      const blobName = fileName
      const blockBlobClient = containerClient.getBlockBlobClient(blobName)
      await blockBlobClient.deleteIfExists()
    }
  }
}
