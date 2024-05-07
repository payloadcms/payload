import type { GenerateURL } from '@payloadcms/plugin-cloud-storage/types'
import type { UTApi } from 'uploadthing/server'

import path from 'path'

type Args = {
  utApi: UTApi
}

/**
 * Format public URL
 */
export const getGenerateURL =
  ({ utApi }: Args): GenerateURL =>
  async ({ filename, prefix = '' }) => {
    const fileKey = path.posix.join(prefix, filename)
    // Not 100% sure this is necessary
    const res = await utApi.getFileUrls(fileKey)
    return res.data?.[0].url
  }
