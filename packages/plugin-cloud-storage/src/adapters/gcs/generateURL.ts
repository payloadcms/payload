import type { Storage } from '@google-cloud/storage'

import path from 'path'

import type { GenerateURL } from '../../types'

interface Args {
  bucket: string
  getStorageClient: () => Storage
}

export const getGenerateURL =
  ({ bucket, getStorageClient }: Args): GenerateURL =>
  ({ filename, prefix = '' }) => {
    return decodeURIComponent(
      getStorageClient().bucket(bucket).file(path.posix.join(prefix, encodeURIComponent(filename))).publicUrl(),
    )
  }
