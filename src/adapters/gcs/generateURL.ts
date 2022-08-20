import { Storage } from '@google-cloud/storage'
import type { GenerateURL } from '../../types'

interface Args {
  gcs: Storage
  bucket: string
}

export const getGenerateURL =
  ({ gcs, bucket }: Args): GenerateURL =>
  ({ filename }) => {
    return gcs.bucket(bucket).file(filename).publicUrl()
  }
