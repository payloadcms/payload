import { put } from '@vercel/blob'
import path from 'path'

interface UploadFileArgs {
  access: 'public'
  addRandomSuffix?: boolean
  baseUrl: string
  buffer: Buffer
  cacheControlMaxAge?: number
  filename: string
  mimeType: string
  prefix: string
  token: string
}

interface UploadFileResult {
  filename?: string
}

export async function uploadFile({
  access,
  addRandomSuffix,
  baseUrl,
  buffer,
  cacheControlMaxAge,
  filename,
  mimeType,
  prefix,
  token,
}: UploadFileArgs): Promise<UploadFileResult> {
  const fileKey = path.posix.join(prefix, filename)

  const result = await put(fileKey, buffer, {
    access,
    addRandomSuffix,
    cacheControlMaxAge,
    contentType: mimeType,
    token,
  })

  if (addRandomSuffix) {
    return { filename: decodeURIComponent(result.url.replace(`${baseUrl}/`, '')) }
  }

  return {}
}
