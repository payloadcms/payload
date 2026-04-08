import type { Storage } from '@google-cloud/storage'
import type { HandleDelete } from '@payloadcms/plugin-cloud-storage/types'

import { joinPrefixes } from '@payloadcms/plugin-cloud-storage/utilities'
import path from 'path'

interface Args {
  basePrefix?: string
  bucket: string
  getStorageClient: () => Storage
}

export const getHandleDelete = ({ basePrefix, bucket, getStorageClient }: Args): HandleDelete => {
  return async ({ doc: { prefix = '' }, filename }) => {
    await getStorageClient()
      .bucket(bucket)
      .file(path.posix.join(joinPrefixes({ basePrefix, prefix }), filename))
      .delete({
        ignoreNotFound: true,
      })
  }
}
