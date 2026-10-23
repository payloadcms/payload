import type { SanitizedCollectionConfig } from '../collections/config/types.js'
import type { SanitizedConfig } from '../config/types.js'
import type { PayloadRequest } from '../types/index.js'

import { disposeFileContent, getFileContent } from './fileContent.js'
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
    const ownership =
      config.upload?.useTempFiles || isClientUploadTempFile ? 'temporary' : 'external'
    const content = getFileContent(file, ownership)

    if (content.type === 'file' && content.ownership === 'temporary') {
      await disposeFileContent(content)
      unlinkedTempFilePath = content.path
    }
  }

  await unlinkClientUploadTempFile({ alreadyUnlinkedPath: unlinkedTempFilePath, req })
}
