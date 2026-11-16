import type { Storage } from '@google-cloud/storage'

interface UploadFileArgs {
  acl?: 'Private' | 'Public'
  bucket: string
  buffer: Buffer
  client: Storage
  mimeType: string
  storageFilePath: string
}

export async function uploadFile({
  acl,
  bucket,
  buffer,
  client,
  mimeType,
  storageFilePath,
}: UploadFileArgs): Promise<void> {
  const gcsFile = client.bucket(bucket).file(storageFilePath)

  await gcsFile.save(buffer, {
    metadata: {
      contentType: mimeType,
    },
  })

  if (acl) {
    await gcsFile[`make${acl}`]()
  }
}
