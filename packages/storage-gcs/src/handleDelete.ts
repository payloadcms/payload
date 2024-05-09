import type { Storage } from '@google-cloud/storage'
import type { HandleDelete } from '@payloadcms/plugin-cloud-storage/types'

import path from 'path'

interface Args {
  bucket: string
  getStorageClient: () => Storage
}

export const getHandleDelete = ({ bucket, getStorageClient }: Args): HandleDelete => {
  return async ({ doc: { prefix = '' }, filename }) => {
    await getStorageClient().bucket(bucket).file(path.posix.join(prefix, filename)).delete({
      ignoreNotFound: true,
    })
  }
}
