import type * as AWS from '@aws-sdk/client-s3'
import type { HandleDelete } from '@payloadcms/plugin-cloud-storage/types'

import { getFileKey } from '@payloadcms/plugin-cloud-storage/utilities'

interface Args {
  bucket: string
  collectionPrefix?: string
  getStorageClient: () => AWS.S3
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
    await getStorageClient().deleteObject({
      Bucket: bucket,
      Key: fileKey,
    })
  }
}
