import type { CollectionConfig } from 'payload/types'
import { BlobServiceClient } from '@azure/storage-blob'
import type { HandleUpload } from '../../types'

interface Args {
  collection: CollectionConfig
  connectionString: string
  containerName: string
  baseURL: string
  allowContainerCreate: boolean
}

export const getHandleUpload = ({
  allowContainerCreate,
  connectionString,
  containerName,
}: Args): HandleUpload => {
  const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString)
  const containerClient = blobServiceClient.getContainerClient(containerName)

  if (allowContainerCreate) {
    containerClient.createIfNotExists({ access: 'blob' })
  }

  return async ({ data, file }) => {
    const blobName = file.filename
    const blockBlobClient = containerClient.getBlockBlobClient(blobName)

    await blockBlobClient.upload(file.buffer, file.buffer.byteLength, {
      blobHTTPHeaders: { blobContentType: file.mimeType },
    })

    return data
  }
}
