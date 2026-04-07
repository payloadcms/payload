import type { ContainerClient } from '@azure/storage-blob'
import type { HandleDelete } from '@payloadcms/plugin-cloud-storage/types'
import type { CollectionConfig } from 'payload'

import { joinPrefixes } from '@payloadcms/plugin-cloud-storage/utilities'
import path from 'path'

interface Args {
  basePrefix?: string
  collection: CollectionConfig
  getStorageClient: () => ContainerClient
}

export const getHandleDelete = ({ basePrefix, getStorageClient }: Args): HandleDelete => {
  return async ({ doc: { prefix = '' }, filename }) => {
    const blockBlobClient = getStorageClient().getBlockBlobClient(
      path.posix.join(joinPrefixes(basePrefix, prefix), filename),
    )
    await blockBlobClient.deleteIfExists()
  }
}
