import type { R2Bucket } from './types.js'

interface DeleteFileArgs {
  bucket: R2Bucket
  storageFilePath: string
}

export async function deleteFile({ bucket, storageFilePath }: DeleteFileArgs): Promise<void> {
  await bucket.delete(storageFilePath)
}
