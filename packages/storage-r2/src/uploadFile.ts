import type { R2Bucket } from './types.js'

const isMiniflare = process.env.NODE_ENV === 'development'

interface UploadFileArgs {
  bucket: R2Bucket
  buffer: Buffer
  mimeType: string
  storageFilePath: string
  tempFilePath?: string
}

export async function uploadFile({
  bucket,
  buffer,
  mimeType,
  storageFilePath,
  tempFilePath,
}: UploadFileArgs): Promise<void> {
  // Read more: https://github.com/cloudflare/workers-sdk/issues/6047#issuecomment-2691217843
  let body = isMiniflare ? new Blob([buffer]) : buffer

  if (tempFilePath) {
    // Workers require filesystem compatibility to use temp files, so keep this import conditional.
    const { openAsBlob } = await import('fs')
    body = await openAsBlob(tempFilePath)
  }

  await bucket.put(storageFilePath, body, {
    httpMetadata: { contentType: mimeType },
  })
}
