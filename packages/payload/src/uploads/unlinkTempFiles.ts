import fs from 'fs/promises'

import type { SanitizedCollectionConfig } from '../collections/config/types.js'
import type { SanitizedConfig } from '../config/types.js'
import type { PayloadRequest } from '../types/index.js'

import { mapAsync } from '../utilities/mapAsync.js'
import { CLIENT_UPLOAD_TEMP_FILE_PATH_CONTEXT_KEY } from './getFileFromClientUpload.js'

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

  // plugin-cloud-storage's afterChange hook clears req.file after uploading generated image
  // sizes, before this cleanup runs, so the materializer's temp file is tracked separately and
  // may still need removing even though req.file no longer references it.
  const clientUploadTempFilePath = req.context?.[CLIENT_UPLOAD_TEMP_FILE_PATH_CONTEXT_KEY]

  if (
    typeof clientUploadTempFilePath === 'string' &&
    clientUploadTempFilePath !== file?.tempFilePath
  ) {
    delete req.context[CLIENT_UPLOAD_TEMP_FILE_PATH_CONTEXT_KEY]
    await fs.unlink(clientUploadTempFilePath)
  }
}
