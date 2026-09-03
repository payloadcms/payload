import fs from 'fs/promises'

import type { SanitizedCollectionConfig } from '../collections/config/types.js'
import type { SanitizedConfig } from '../config/types.js'
import type { PayloadRequest } from '../types/index.js'

import { mapAsync } from '../utilities/mapAsync.js'

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
  const isClientUploadTempFile = Boolean(
    file?.tempFilePath && Object.prototype.hasOwnProperty.call(file, 'clientUploadContext'),
  )

  if (collectionConfig.upload && (config.upload?.useTempFiles || isClientUploadTempFile)) {
    const fileArray = [{ file }]
    await mapAsync(fileArray, async ({ file }) => {
      // Still need this check because this will not be populated if using local API
      if (file?.tempFilePath) {
        await fs.unlink(file.tempFilePath)
      }
    })
  }
}
