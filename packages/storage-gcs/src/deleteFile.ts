import type { Storage } from '@google-cloud/storage'

interface DeleteFileArgs {
  bucket: string
  client: Storage
  storageFilePath: string
}

export async function deleteFile({
  bucket,
  client,
  storageFilePath,
}: DeleteFileArgs): Promise<void> {
  await client.bucket(bucket).file(storageFilePath).delete({
    ignoreNotFound: true,
  })
}
