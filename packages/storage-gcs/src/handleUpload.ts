import type { Storage } from '@google-cloud/storage'
import type { HandleUpload } from '@payloadcms/plugin-cloud-storage/types'
import type { CollectionConfig } from 'payload'

import path from 'path'

interface Args {
  acl?: 'Private' | 'Public'
  bucket: string
  collection: CollectionConfig
  getStorageClient: () => Storage
  prefix?: string
}

export const getHandleUpload = ({
  acl,
  bucket,
  getStorageClient,
  prefix = '',
}: Args): HandleUpload => {
  return async ({ data, file }) => {
    const fileKey = path.posix.join(data.prefix || prefix, file.filename)

    const gcsFile = getStorageClient().bucket(bucket).file(fileKey)
    await gcsFile.save(file.buffer, {
      metadata: {
        contentType: file.mimeType,
      },
    })

    if (acl) {
      await gcsFile[`make${acl}`]()
    }

    return data
  }
}
