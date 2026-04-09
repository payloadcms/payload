import type { Storage } from '@google-cloud/storage'

import path from 'path'

interface DeleteFileArgs {
  bucket: string
  client: Storage
  filename: string
  prefix: string
}

export async function deleteFile({
  bucket,
  client,
  filename,
  prefix,
}: DeleteFileArgs): Promise<void> {
  await client.bucket(bucket).file(path.posix.join(prefix, filename)).delete({
    ignoreNotFound: true,
  })
}
