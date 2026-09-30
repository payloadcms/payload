import fs from 'fs/promises'

import type { SanitizedCollectionConfig } from '../collections/config/types.js'
import type { SanitizedConfig } from '../config/types.js'
import type { PayloadRequest } from '../types/index.js'

import { unlinkClientUploadTempFile } from './unlinkClientUploadTempFile.js'

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
  const preservedTempFilePath = req.context?._payloadCloudStorageTempFilePath
  const tempFilePath =
    file?.tempFilePath ??
    (typeof preservedTempFilePath === 'string' ? preservedTempFilePath : undefined)
  const isClientUploadTempFile = Boolean(
    file?.tempFilePath && Object.prototype.hasOwnProperty.call(file, 'clientUploadContext'),
  )
  let unlinkedTempFilePath: string | undefined

  if (collectionConfig.upload && (config.upload?.useTempFiles || isClientUploadTempFile)) {
    if (tempFilePath) {
      await fs.unlink(tempFilePath)
      unlinkedTempFilePath = tempFilePath
    }
  }

  await unlinkClientUploadTempFile({ alreadyUnlinkedPath: unlinkedTempFilePath, req })
  if (req.context) {
    delete req.context._payloadCloudStorageTempFilePath
  }
}
