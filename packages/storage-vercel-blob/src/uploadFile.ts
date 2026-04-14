import { getFileKey } from '@payloadcms/plugin-cloud-storage/utilities'
import { put } from '@vercel/blob'

interface UploadFileArgs {
  access: 'public'
  addRandomSuffix?: boolean
  baseUrl: string
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
  baseUrl,
  buffer,
  cacheControlMaxAge,
  collectionPrefix = '',
  docPrefix,
  filename,
  mimeType,
  token,
  useCompositePrefixes = false,
}: UploadFileArgs): Promise<UploadFileResult> {
  const fileKey = getFileKey({
    collectionPrefix,
    docPrefix: docPrefix || '',
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
    return { filename: decodeURIComponent(result.url.replace(`${baseUrl}/`, '')) }
  }

  return {}
}
