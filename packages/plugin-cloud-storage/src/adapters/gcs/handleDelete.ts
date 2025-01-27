import type { Storage } from '@google-cloud/storage'

import path from 'path'

import type { HandleDelete } from '../../types'

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
