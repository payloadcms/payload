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
  // Older Miniflare versions reject Node Buffers and send a view's whole backing buffer, so pass a
  // plain view that owns exactly these bytes. Only pooled or sliced Buffers need a copy.
  const ownsWholeBuffer = buffer.byteOffset === 0 && buffer.byteLength === buffer.buffer.byteLength
  const body = ownsWholeBuffer ? new Uint8Array(buffer.buffer) : new Uint8Array(buffer)

  await bucket.put(storageFilePath, body, {
    httpMetadata: { contentType: mimeType },
  })
}
