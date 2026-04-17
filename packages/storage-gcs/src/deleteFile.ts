import type { Storage } from '@google-cloud/storage'

import { getFileKey } from '@payloadcms/plugin-cloud-storage/utilities'

interface DeleteFileArgs {
  bucket: string
  client: Storage
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
}: DeleteFileArgs): Promise<void> {
  const { fileKey } = getFileKey({
    collectionPrefix,
    docPrefix,
    filename,
    useCompositePrefixes,
  })

  await client.bucket(bucket).file(fileKey).delete({
    ignoreNotFound: true,
  })
}
