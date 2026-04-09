import type { Storage } from '@google-cloud/storage'
import type { HandleUpload } from '@payloadcms/plugin-cloud-storage/types'

import { getFileKey } from '@payloadcms/plugin-cloud-storage/utilities'

interface Args {
  acl?: 'Private' | 'Public'
  bucket: string
  collectionPrefix?: string
  getStorageClient: () => Storage
  useCompositePrefixes?: boolean
}

export const getHandleUpload = ({
  acl,
  bucket,
  collectionPrefix = '',
  getStorageClient,
  useCompositePrefixes = false,
}: Args): HandleUpload => {
  return async ({ data, file }) => {
    const fileKey = getFileKey({
      collectionPrefix,
      docPrefix: data.prefix,
      filename: file.filename,
      useCompositePrefixes,
    })

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
