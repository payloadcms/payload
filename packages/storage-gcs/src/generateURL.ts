import type { Storage } from '@google-cloud/storage'
import type { GenerateURL } from '@payloadcms/plugin-cloud-storage/types'

import { joinPrefixes } from '@payloadcms/plugin-cloud-storage/utilities'
import path from 'path'

interface Args {
  basePrefix?: string
  bucket: string
  getStorageClient: () => Storage
}

export const getGenerateURL =
  ({ basePrefix, bucket, getStorageClient }: Args): GenerateURL =>
  ({ filename, prefix = '' }) => {
    return decodeURIComponent(
      getStorageClient()
        .bucket(bucket)
        .file(path.posix.join(joinPrefixes(basePrefix, prefix), filename))
        .publicUrl(),
    )
  }
