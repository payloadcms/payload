import type { Storage } from '@google-cloud/storage'
import type { GenerateURL } from '@payloadcms/plugin-cloud-storage/types'

import { getFileKey } from '@payloadcms/plugin-cloud-storage/utilities'

interface Args {
  bucket: string
  collectionPrefix?: string
  getStorageClient: () => Storage
  useCompositePrefixes?: boolean
}

export const getGenerateURL =
  ({
    bucket,
    collectionPrefix = '',
    getStorageClient,
    useCompositePrefixes = false,
  }: Args): GenerateURL =>
  ({ filename, prefix = '' }) => {
    const fileKey = getFileKey({
      collectionPrefix,
      docPrefix: prefix,
      filename,
      useCompositePrefixes,
    })
    return decodeURIComponent(getStorageClient().bucket(bucket).file(fileKey).publicUrl())
  }
