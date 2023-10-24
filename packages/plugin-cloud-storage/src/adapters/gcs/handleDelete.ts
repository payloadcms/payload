import path from 'path'
import { Storage } from '@google-cloud/storage'
import type { HandleDelete } from '../../types'

interface Args {
  getStorageClient: () => Storage
  bucket: string
}

export const getHandleDelete = ({ getStorageClient, bucket }: Args): HandleDelete => {
  return async ({ filename, doc: { prefix = '' } }) => {
    await getStorageClient().bucket(bucket).file(path.posix.join(prefix, filename)).delete({
      ignoreNotFound: true,
    })
  }
}
