import type { ContainerClient } from '@azure/storage-blob'
import type { CollectionConfig } from 'payload/types'
import type { HandleUpload } from '../../types'

interface Args {
  collection: CollectionConfig
  containerClient: ContainerClient
  allowContainerCreate: boolean
}

export const getHandleUpload = ({ allowContainerCreate, containerClient }: Args): HandleUpload => {
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
