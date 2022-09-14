import path from 'path'
import type { ContainerClient } from '@azure/storage-blob'
import type { CollectionConfig } from 'payload/types'
import type { HandleUpload } from '../../types'

interface Args {
  collection: CollectionConfig
  containerClient: ContainerClient
  allowContainerCreate: boolean
  prefix?: string
}

export const getHandleUpload = ({
  allowContainerCreate,
  containerClient,
  prefix = '',
}: Args): HandleUpload => {
  if (allowContainerCreate) {
    containerClient.createIfNotExists({ access: 'blob' })
  }

  return async ({ data, file }) => {
    const blockBlobClient = containerClient.getBlockBlobClient(
      path.posix.join(prefix, file.filename),
    )

    await blockBlobClient.upload(file.buffer, file.buffer.byteLength, {
      blobHTTPHeaders: { blobContentType: file.mimeType },
    })

    return data
  }
}
