import { del } from '@vercel/blob'

import { buildBlobUrl } from './generateURL.js'

interface DeleteFileArgs {
  baseUrl: string
  storageFilePath: string
  /**
   * Store ID for OIDC authentication. When no `token` is provided, @vercel/blob
   * resolves OIDC credentials from the environment and uses this store ID.
   */
  storeId?: string
  /**
   * Read/write token. When undefined, @vercel/blob resolves OIDC credentials
   * from the environment instead.
   */
  token?: string
}

/**
 * Deletes a file from Vercel Blob. Authenticates with `token`, or via OIDC when
 * it is omitted.
 */
export async function deleteFile({
  baseUrl,
  storageFilePath,
  storeId,
  token,
}: DeleteFileArgs): Promise<void> {
  await del(buildBlobUrl(baseUrl, storageFilePath), { storeId, token })
}
