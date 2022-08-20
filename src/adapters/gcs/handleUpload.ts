import { Storage } from '@google-cloud/storage'
import type { CollectionConfig } from 'payload/types'
import type { HandleUpload } from '../../types'

interface Args {
  collection: CollectionConfig
  bucket: string
  acl?: 'Private' | 'Public'
  gcs: Storage
}

export const getHandleUpload = ({ gcs, bucket, acl }: Args): HandleUpload => {
  return async ({ data, file }) => {
    const gcsFile = gcs.bucket(bucket).file(file.filename)
    await gcsFile.save(file.buffer, {
      contentType: file.mimeType,
    })
    if (acl) {
      await gcsFile[`make${acl}`]()
    }

    return data
  }
}
