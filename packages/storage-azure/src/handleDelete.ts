import type { ContainerClient } from '@azure/storage-blob'

import path from 'path'

interface DeleteArgs {
  client: ContainerClient
  filename: string
  prefix: string
}

export async function deleteFile({ client, filename, prefix }: DeleteArgs): Promise<void> {
  const blockBlobClient = client.getBlockBlobClient(path.posix.join(prefix, filename))
  await blockBlobClient.deleteIfExists()
}
