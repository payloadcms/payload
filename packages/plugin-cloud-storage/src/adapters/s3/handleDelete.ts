import type * as AWS from '@aws-sdk/client-s3'

import path from 'path'

import type { HandleDelete } from '../../types'

interface Args {
  bucket: string
  getStorageClient: () => AWS.S3
}

export const getHandleDelete = ({ bucket, getStorageClient }: Args): HandleDelete => {
  return async ({ doc: { prefix = '' }, filename }) => {
    await getStorageClient().deleteObject({
      Bucket: bucket,
      Key: path.posix.join(prefix, filename),
    })
  }
}
