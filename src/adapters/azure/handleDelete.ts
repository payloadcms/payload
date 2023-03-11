import path from 'path'
import type { CollectionConfig } from 'payload/types'
import type { ContainerClient } from '@azure/storage-blob'
import type { HandleDelete } from '../../types'

interface Args {
  collection: CollectionConfig
  getStorageClient: () => ContainerClient
}

export const getHandleDelete = ({ getStorageClient }: Args): HandleDelete => {
  return async ({ filename, doc: { prefix = '' } }) => {
    const blockBlobClient = getStorageClient().getBlockBlobClient(path.posix.join(prefix, filename))
    await blockBlobClient.deleteIfExists()
  }
}
