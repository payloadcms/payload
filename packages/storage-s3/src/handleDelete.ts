import type * as AWS from '@aws-sdk/client-s3'
import type { HandleDelete } from '@payloadcms/plugin-cloud-storage/types'

import { joinPrefixes } from '@payloadcms/plugin-cloud-storage/utilities'
import path from 'path'

interface Args {
  basePrefix?: string
  bucket: string
  getStorageClient: () => AWS.S3
}

export const getHandleDelete = ({ basePrefix, bucket, getStorageClient }: Args): HandleDelete => {
  return async ({ doc: { prefix = '' }, filename }) => {
    await getStorageClient().deleteObject({
      Bucket: bucket,
      Key: path.posix.join(joinPrefixes({ basePrefix, prefix }), filename),
    })
  }
}
