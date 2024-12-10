import type { ContainerClient } from '@azure/storage-blob'
import type { HandleDelete } from '@payloadcms/plugin-cloud-storage/types'
import type { CollectionConfig } from 'payload'

import path from 'path'

interface Args {
  collection: CollectionConfig
  getStorageClient: () => ContainerClient
}

export const getHandleDelete = ({ getStorageClient }: Args): HandleDelete => {
  return async ({ doc: { prefix = '' }, filename }) => {
    const blockBlobClient = getStorageClient().getBlockBlobClient(path.posix.join(prefix, filename))
    await blockBlobClient.deleteIfExists()
  }
}
