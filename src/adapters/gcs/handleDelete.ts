import path from 'path'
import { Storage } from '@google-cloud/storage'
import type { HandleDelete } from '../../types'

interface Args {
  gcs: Storage
  bucket: string
}

export const getHandleDelete = ({ gcs, bucket }: Args): HandleDelete => {
  return async ({ filename, prefix = '' }) => {
    await gcs.bucket(bucket).file(path.posix.join(prefix, filename)).delete({
      ignoreNotFound: true,
    })
  }
}
