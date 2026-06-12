import { getFileKey } from '@payloadcms/plugin-cloud-storage/utilities'

import type { R2Bucket } from './types.js'

const isMiniflare = process.env.NODE_ENV === 'development'

interface UploadFileArgs {
  bucket: R2Bucket
  buffer: Buffer
  collectionPrefix?: string
  docPrefix?: string
  filename: string
  mimeType: string
  useCompositePrefixes?: boolean
}

export async function uploadFile({
  bucket,
  buffer,
  collectionPrefix = '',
  docPrefix,
  filename,
  mimeType,
  useCompositePrefixes = false,
}: UploadFileArgs): Promise<void> {
  // Read more: https://github.com/cloudflare/workers-sdk/issues/6047#issuecomment-2691217843
  const body = isMiniflare ? new Blob([buffer]) : buffer

  const { fileKey } = getFileKey({
    collectionPrefix,
    docPrefix,
    filename,
    useCompositePrefixes,
  })

  await bucket.put(fileKey, body, {
    httpMetadata: { contentType: mimeType },
  })
}
