import { del } from '@vercel/blob'

import { buildBlobUrl } from './generateURL.js'

interface DeleteFileArgs {
  baseUrl: string
  storageFilePath: string
  token: string
}

export async function deleteFile({
  baseUrl,
  storageFilePath,
  token,
}: DeleteFileArgs): Promise<void> {
  await del(buildBlobUrl(baseUrl, storageFilePath), { token })
}
