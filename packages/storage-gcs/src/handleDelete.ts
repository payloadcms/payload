import type { Storage } from '@google-cloud/storage'
import type { HandleDelete } from '@payloadcms/plugin-cloud-storage/types'

import { getFileKey } from '@payloadcms/plugin-cloud-storage/utilities'

interface Args {
  bucket: string
  collectionPrefix?: string
  getStorageClient: () => Storage
  useCompositePrefixes?: boolean
}

export const getHandleDelete = ({
  bucket,
  collectionPrefix = '',
  getStorageClient,
  useCompositePrefixes = false,
}: Args): HandleDelete => {
  return async ({ doc: { prefix = '' }, filename }) => {
    const fileKey = getFileKey({
      collectionPrefix,
      docPrefix: prefix,
      filename,
      useCompositePrefixes,
    })
    await getStorageClient().bucket(bucket).file(fileKey).delete({
      ignoreNotFound: true,
    })
  }
}
