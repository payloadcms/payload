import { getFileKey } from '@payloadcms/plugin-cloud-storage/utilities'

import type { R2Bucket } from './types.js'

interface DeleteFileArgs {
  bucket: R2Bucket
  collectionPrefix?: string
  docPrefix: string
  filename: string
  useCompositePrefixes?: boolean
}

export async function deleteFile({
  bucket,
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

  await bucket.delete(fileKey)
}
