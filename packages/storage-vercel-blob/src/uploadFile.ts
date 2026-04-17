import { getFileKey } from '@payloadcms/plugin-cloud-storage/utilities'
import { put } from '@vercel/blob'
import path from 'path'

interface UploadFileArgs {
  access: 'public'
  addRandomSuffix?: boolean
  buffer: Buffer
  cacheControlMaxAge?: number
  collectionPrefix?: string
  docPrefix?: string
  filename: string
  mimeType: string
  token: string
  useCompositePrefixes?: boolean
}

interface UploadFileResult {
  filename?: string
}

export async function uploadFile({
  access,
  addRandomSuffix,
  buffer,
  cacheControlMaxAge,
  collectionPrefix = '',
  docPrefix,
  filename,
  mimeType,
  token,
  useCompositePrefixes = false,
}: UploadFileArgs): Promise<UploadFileResult> {
  const { fileKey } = getFileKey({
    collectionPrefix,
    docPrefix,
    filename,
    useCompositePrefixes,
  })

  const result = await put(fileKey, buffer, {
    access,
    addRandomSuffix,
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
