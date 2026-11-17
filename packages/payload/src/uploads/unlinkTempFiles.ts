import fs from 'fs/promises'

import type { SanitizedCollectionConfig } from '../collections/config/types.js'
import type { SanitizedConfig } from '../config/types.js'
import type { PayloadRequest } from '../types/index.js'

import { mapAsync } from '../utilities/mapAsync.js'

type Args = {
  collectionConfig?: SanitizedCollectionConfig
  config: SanitizedConfig
  req: PayloadRequest
}
/**
 * Cleanup temp files after operation lifecycle
 */
export const unlinkTempFiles: (args: Args) => Promise<void> = async ({ config, req }) => {
  const requestFiles = Object.values(req.files ?? {}).flatMap((file) =>
    Array.isArray(file) ? file : [file],
  )
  const files = [req.file, ...requestFiles]
  const tempFilePaths = new Set<string>()
  const isClientUploadTempFile = Boolean(
    req.file?.uploadReference || req.context?._payloadClientUploadTempFile,
  )

  for (const file of files) {
    if (file?.tempFilePath && (config.upload?.useTempFiles || isClientUploadTempFile)) {
      tempFilePaths.add(file.tempFilePath)
    }
  }

  await mapAsync([...tempFilePaths], async (tempFilePath) => {
    await fs.unlink(tempFilePath)
  })
}
