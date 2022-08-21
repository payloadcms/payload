import { Storage } from '@google-cloud/storage'
import type { HandleDelete } from '../../types'

interface Args {
  gcs: Storage
  bucket: string
}

export const getHandleDelete = ({ gcs, bucket }: Args): HandleDelete => {
  return async ({ filename }) => {
    await gcs.bucket(bucket).file(filename).delete({
      ignoreNotFound: true,
    })
  }
}
