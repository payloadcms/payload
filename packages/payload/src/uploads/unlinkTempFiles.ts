import type { SanitizedCollectionConfig } from '../collections/config/types.js'
import type { SanitizedConfig } from '../config/types.js'
import type { PayloadRequest } from '../types/index.js'

import { deleteTempFile, getFileSource } from './fileSource.js'
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
  const isClientUploadTempFile = Boolean(
    file?.tempFilePath && Object.prototype.hasOwnProperty.call(file, 'clientUploadContext'),
  )

  let unlinkedTempFilePath: string | undefined

  if (collectionConfig.upload && file) {
    const isTemporary = Boolean(config.upload?.useTempFiles || isClientUploadTempFile)
    const source = getFileSource(file, isTemporary)

    if (source.type === 'file' && source.isTemporary) {
      await deleteTempFile(source)
      unlinkedTempFilePath = source.path
    }
  }

  await unlinkClientUploadTempFile({ alreadyUnlinkedPath: unlinkedTempFilePath, req })
}
