import fs from 'fs/promises'

import type { SanitizedCollectionConfig } from '../collections/config/types.js'
import type { SanitizedConfig } from '../config/types.js'
import type { PayloadRequest } from '../types/index.js'

type Args = {
  collectionConfig: SanitizedCollectionConfig
  config: SanitizedConfig
  req: PayloadRequest
}
/**
 * Cleanup temp files after operation lifecycle
 */
export const unlinkTempFiles: (args: Args) => Promise<void> = async ({
  collectionConfig,
  config,
  req,
}) => {
  const { file } = req
  const clientUploadTempFilePath = req.context?._payloadClientUploadTempFile
  const preservedTempFilePath = req.context?._payloadCloudStorageTempFilePath
  const tempFilePath =
    file?.tempFilePath ??
    (typeof preservedTempFilePath === 'string' ? preservedTempFilePath : undefined) ??
    (typeof clientUploadTempFilePath === 'string' ? clientUploadTempFilePath : undefined)

  // A file fetched from a client-upload reference always gets its own temp file for
  // post-processing (see getFileFromUploadInstructions.ts), regardless of the global
  // useTempFiles setting, so it must always be cleaned up here too.
  const isClientUploadTempFile = Boolean(file?.uploadReference || clientUploadTempFilePath)

  if (collectionConfig.upload && (config.upload?.useTempFiles || isClientUploadTempFile)) {
    if (tempFilePath) {
      await fs.unlink(tempFilePath)
      if (req.context) {
        delete req.context._payloadCloudStorageTempFilePath
        delete req.context._payloadClientUploadTempFile
      }
    }
  }
}
