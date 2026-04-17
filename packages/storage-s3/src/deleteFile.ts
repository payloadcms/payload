import type * as AWS from '@aws-sdk/client-s3'

import { getFileKey } from '@payloadcms/plugin-cloud-storage/utilities'

interface DeleteArgs {
  bucket: string
  client: AWS.S3
  collectionPrefix?: string
  docPrefix: string
  filename: string
  useCompositePrefixes?: boolean
}

export async function deleteFile({
  bucket,
  client,
  collectionPrefix = '',
  docPrefix,
  filename,
  useCompositePrefixes = false,
}: DeleteArgs): Promise<void> {
  const { fileKey } = getFileKey({
    collectionPrefix,
    docPrefix,
    filename,
    useCompositePrefixes,
  })

  await client.deleteObject({
    Bucket: bucket,
    Key: fileKey,
  })
}
