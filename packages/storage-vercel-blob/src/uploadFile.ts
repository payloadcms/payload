import type { FileContent } from 'payload/internal'

import { put } from '@vercel/blob'
import path from 'path'
import { getFileBlob } from 'payload/internal'

interface UploadFileArgs {
  access: 'public'
  addRandomSuffix?: boolean
  cacheControlMaxAge?: number
  content: FileContent
  mimeType: string
  storageFilePath: string
  token: string
}

interface UploadFileResult {
  filename?: string
}

export async function uploadFile({
  access,
  addRandomSuffix,
  cacheControlMaxAge,
  content,
  mimeType,
  storageFilePath,
  token,
}: UploadFileArgs): Promise<UploadFileResult> {
  const body = await getFileBlob(content, mimeType)
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
