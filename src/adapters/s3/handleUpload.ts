import type * as AWS from '@aws-sdk/client-s3'
import type { CollectionConfig } from 'payload/types'
import type { HandleUpload } from '../../types'

interface Args {
  collection: CollectionConfig
  bucket: string
  acl?: 'private' | 'public-read'
  s3: AWS.S3
}

export const getHandleUpload = ({ s3, bucket, acl }: Args): HandleUpload => {
  return async ({ data, file }) => {
    await s3.putObject({
      Bucket: bucket,
      Key: file.filename,
      Body: file.buffer,
      ACL: acl,
      ContentType: file.mimeType,
    })

    return data
  }
}
