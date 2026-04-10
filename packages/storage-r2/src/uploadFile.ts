import path from 'path'

import type { R2Bucket } from './types.js'

const isMiniflare = process.env.NODE_ENV === 'development'

interface UploadFileArgs {
  bucket: R2Bucket
  buffer: Buffer
  filename: string
  mimeType: string
  prefix: string
}

export async function uploadFile({
  bucket,
  buffer,
  filename,
  mimeType,
  prefix,
}: UploadFileArgs): Promise<void> {
  // Read more: https://github.com/cloudflare/workers-sdk/issues/6047#issuecomment-2691217843
  const body = isMiniflare ? new Blob([buffer]) : buffer
  await bucket.put(path.posix.join(prefix, filename), body, {
    httpMetadata: { contentType: mimeType },
  })
}
