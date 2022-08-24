import path from 'path'
import type { CollectionConfig } from 'payload/types'
import type { ContainerClient } from '@azure/storage-blob'
import type { HandleDelete } from '../../types'

interface Args {
  collection: CollectionConfig
  containerClient: ContainerClient
}

export const getHandleDelete = ({ containerClient }: Args): HandleDelete => {
  return async ({ filename, prefix = '' }) => {
    const blockBlobClient = containerClient.getBlockBlobClient(path.posix.join(prefix, filename))
    await blockBlobClient.deleteIfExists()
  }
}
