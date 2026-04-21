import type { Storage } from '@google-cloud/storage'

import { getFileKey } from '@payloadcms/plugin-cloud-storage/utilities'

interface UploadFileArgs {
  acl?: 'Private' | 'Public'
  bucket: string
  buffer: Buffer
  client: Storage
  collectionPrefix?: string
  docPrefix?: string
  filename: string
  mimeType: string
  useCompositePrefixes?: boolean
}

export async function uploadFile({
  acl,
  bucket,
  buffer,
  client,
  collectionPrefix = '',
  docPrefix,
  filename,
  mimeType,
  useCompositePrefixes = false,
}: UploadFileArgs): Promise<void> {
  const { fileKey } = getFileKey({
    collectionPrefix,
    docPrefix: docPrefix || '',
    filename,
    useCompositePrefixes,
  })

  const gcsFile = client.bucket(bucket).file(fileKey)

  await gcsFile.save(buffer, {
    metadata: {
      contentType: mimeType,
    },
  })

  if (acl) {
    await gcsFile[`make${acl}`]()
  }
}
