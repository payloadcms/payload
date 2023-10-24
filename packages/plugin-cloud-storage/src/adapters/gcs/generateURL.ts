import path from 'path'
import { Storage } from '@google-cloud/storage'
import type { GenerateURL } from '../../types'

interface Args {
  getStorageClient: () => Storage
  bucket: string
}

export const getGenerateURL =
  ({ getStorageClient, bucket }: Args): GenerateURL =>
  ({ filename, prefix = '' }) => {
    return decodeURIComponent(
      getStorageClient().bucket(bucket).file(path.posix.join(prefix, filename)).publicUrl(),
    )
  }
