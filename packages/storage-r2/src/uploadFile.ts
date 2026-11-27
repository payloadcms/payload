import type { R2Bucket } from './types.js'

interface UploadFileArgs {
  bucket: R2Bucket
  buffer: Buffer
  mimeType: string
  storageFilePath: string
}

export async function uploadFile({
  bucket,
  buffer,
  mimeType,
  storageFilePath,
}: UploadFileArgs): Promise<void> {
  // Older Miniflare versions reject Node Buffers, so pass a plain view of the same bytes.
  const body = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength)

  await bucket.put(storageFilePath, body, {
    httpMetadata: { contentType: mimeType },
  })
}
