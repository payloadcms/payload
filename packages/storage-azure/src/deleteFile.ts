import type { ContainerClient } from '@azure/storage-blob'

interface DeleteArgs {
  client: ContainerClient
  storageFilePath: string
}

export async function deleteFile({ client, storageFilePath }: DeleteArgs): Promise<void> {
  const blockBlobClient = client.getBlockBlobClient(storageFilePath)

  await blockBlobClient.deleteIfExists()
}
