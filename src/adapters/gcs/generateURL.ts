import path from 'path'
import { Storage } from '@google-cloud/storage'
import type { GenerateURL } from '../../types'

interface Args {
  gcs: Storage
  bucket: string
}

export const getGenerateURL =
  ({ gcs, bucket }: Args): GenerateURL =>
  ({ filename, prefix = '' }) => {
    return decodeURIComponent(
      gcs.bucket(bucket).file(path.posix.join(prefix, filename)).publicUrl(),
    )
  }
