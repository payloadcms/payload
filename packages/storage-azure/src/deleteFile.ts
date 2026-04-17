import type { ContainerClient } from '@azure/storage-blob'

import { getFileKey } from '@payloadcms/plugin-cloud-storage/utilities'

interface DeleteArgs {
  client: ContainerClient
  collectionPrefix?: string
  docPrefix: string
  filename: string
  useCompositePrefixes?: boolean
}

export async function deleteFile({
  client,
  collectionPrefix = '',
  docPrefix,
  filename,
  useCompositePrefixes = false,
}: DeleteArgs): Promise<void> {
  const { fileKey } = getFileKey({
    collectionPrefix,
    docPrefix,
    filename,
    useCompositePrefixes,
  })

  const blockBlobClient = client.getBlockBlobClient(fileKey)

  await blockBlobClient.deleteIfExists()
}
