import type { ContainerClient } from '@azure/storage-blob'
import type { HandleDelete } from '@payloadcms/plugin-cloud-storage/types'

import { getFileKey } from '@payloadcms/plugin-cloud-storage/utilities'

interface Args {
  collectionPrefix?: string
  getStorageClient: () => ContainerClient
  useCompositePrefixes?: boolean
}

export const getHandleDelete = ({
  collectionPrefix = '',
  getStorageClient,
  useCompositePrefixes = false,
}: Args): HandleDelete => {
  return async ({ doc: { prefix = '' }, filename }) => {
    const fileKey = getFileKey({
      collectionPrefix,
      docPrefix: prefix,
      filename,
      useCompositePrefixes,
    })
    const blockBlobClient = getStorageClient().getBlockBlobClient(fileKey)
    await blockBlobClient.deleteIfExists()
  }
}
