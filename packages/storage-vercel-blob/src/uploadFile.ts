import { put } from '@vercel/blob'
import { openAsBlob } from 'fs'
import path from 'path'

interface UploadFileArgs {
  access: 'public'
  addRandomSuffix?: boolean
  buffer: Buffer
  cacheControlMaxAge?: number
  mimeType: string
  storageFilePath: string
  /**
   * Store ID for OIDC authentication. When no `token` is provided, @vercel/blob
   * resolves OIDC credentials from the environment and uses this store ID.
   */
  storeId?: string
  tempFilePath?: string
  /**
   * Read/write token. When undefined, @vercel/blob resolves OIDC credentials
   * from the environment instead.
   */
  token?: string
}

interface UploadFileResult {
  filename?: string
}

/**
 * Uploads a file to Vercel Blob and returns the stored filename when a random
 * suffix was added. Authenticates with `token`, or via OIDC when it is omitted.
 */
export async function uploadFile({
  access,
  addRandomSuffix,
  buffer,
  cacheControlMaxAge,
  mimeType,
  storageFilePath,
  storeId,
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
    storeId,
    token,
  })

  if (addRandomSuffix) {
    const pathname = result.pathname.replace(/^\/+/, '')
    const basename = path.posix.basename(pathname)
    return { filename: decodeURIComponent(basename) }
  }

  return {}
}
