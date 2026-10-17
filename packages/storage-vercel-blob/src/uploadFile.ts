import { put } from '@vercel/blob'
import { openAsBlob } from 'node:fs'
import path from 'path'

interface UploadFileArgs {
  access: 'public'
  addRandomSuffix?: boolean
  buffer: Buffer
  cacheControlMaxAge?: number
  mimeType: string
  storageFilePath: string
  tempFilePath?: string
  token: string
}

interface UploadFileResult {
  filename?: string
}

export async function uploadFile({
  access,
  addRandomSuffix,
  buffer,
  cacheControlMaxAge,
  mimeType,
  storageFilePath,
  tempFilePath,
  token,
}: UploadFileArgs): Promise<UploadFileResult> {
  const body = tempFilePath ? await openAsBlob(tempFilePath) : buffer
  const result = await put(storageFilePath, body, {
    access,
    addRandomSuffix,
    allowOverwrite: true,
    cacheControlMaxAge,
    contentType: mimeType,
    token,
  })

  if (addRandomSuffix) {
    const pathname = result.pathname.replace(/^\/+/, '')
    const basename = path.posix.basename(pathname)
    return { filename: decodeURIComponent(basename) }
  }

  return {}
}
