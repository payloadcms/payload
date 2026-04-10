import type * as AWS from '@aws-sdk/client-s3'

import path from 'path'

interface DeleteArgs {
  bucket: string
  client: AWS.S3
  filename: string
  prefix: string
}

export async function deleteFile({ bucket, client, filename, prefix }: DeleteArgs): Promise<void> {
  await client.deleteObject({
    Bucket: bucket,
    Key: path.posix.join(prefix, filename),
  })
}
