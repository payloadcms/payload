import type { ContainerClient } from '@azure/storage-blob'
import type { CollectionConfig } from 'payload/types'

import path from 'path'

import type { HandleDelete } from '../../types'

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
