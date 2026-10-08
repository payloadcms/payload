import type * as AWS from '@aws-sdk/client-s3'

interface DeleteArgs {
  bucket: string
  client: AWS.S3
  storageFilePath: string
}

export async function deleteFile({ bucket, client, storageFilePath }: DeleteArgs): Promise<void> {
  await client.deleteObject({
    Bucket: bucket,
    Key: storageFilePath,
  })
}
