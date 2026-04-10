import type { Storage } from '@google-cloud/storage'

import path from 'path'

interface GenerateURLArgs {
  bucket: string
  client: Storage
  filename: string
  prefix: string
}

export function generateURL({ bucket, client, filename, prefix }: GenerateURLArgs): string {
  return decodeURIComponent(
    client.bucket(bucket).file(path.posix.join(prefix, filename)).publicUrl(),
  )
}
