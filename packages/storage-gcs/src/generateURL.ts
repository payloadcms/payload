import type { Storage } from '@google-cloud/storage'
import type { GenerateURL } from '@payloadcms/plugin-cloud-storage/types'

import path from 'path'

interface Args {
  bucket: string
  getStorageClient: () => Storage
}

export const getGenerateURL =
  ({ bucket, getStorageClient }: Args): GenerateURL =>
  ({ filename, prefix = '' }) => {
    return decodeURIComponent(
      getStorageClient().bucket(bucket).file(path.posix.join(prefix, filename)).publicUrl(),
    )
  }
