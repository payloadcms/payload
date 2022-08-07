import type { CollectionConfig } from 'payload/types'
import type { ContainerClient } from '@azure/storage-blob'
import type { HandleDelete } from '../../types'

interface Args {
  collection: CollectionConfig
  containerClient: ContainerClient
}

export const getHandleDelete = ({ containerClient }: Args): HandleDelete => {
  return async ({ filename }) => {
    const blockBlobClient = containerClient.getBlockBlobClient(filename)
    await blockBlobClient.deleteIfExists()
  }
}
