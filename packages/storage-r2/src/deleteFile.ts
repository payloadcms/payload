import path from 'path'

import type { R2Bucket } from './types.js'

interface DeleteFileArgs {
  bucket: R2Bucket
  filename: string
  prefix: string
}

export async function deleteFile({ bucket, filename, prefix }: DeleteFileArgs): Promise<void> {
  await bucket.delete(path.posix.join(prefix, filename))
}
