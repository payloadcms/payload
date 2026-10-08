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
  const body = tempFilePath
    ? await (await import('node:fs')).openAsBlob(tempFilePath)
    : isMiniflare
      ? new Blob([buffer])
      : buffer

  await bucket.put(storageFilePath, body, {
    httpMetadata: { contentType: mimeType },
  })
}
