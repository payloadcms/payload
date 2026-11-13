import type { SanitizedCollectionConfig } from '../../../collections/config/types.js'
import type { PayloadRequest } from '../../../types/index.js'

import { checkFileRestrictions } from '../../checkFileRestrictions.js'
import { isProcessableImage } from '../../isProcessableImage.js'

/** Checks the file, and uses the detected MIME type when the file is a processable image. */
export async function checkFileAndUseDetectedType({
  collection,
  file,
  req,
}: {
  collection: SanitizedCollectionConfig
  file: NonNullable<PayloadRequest['file']>
  req: PayloadRequest
}): Promise<NonNullable<PayloadRequest['file']>> {
  const detectedFileType = await checkFileRestrictions({ collection, file, req })

  const shouldUseDetectedFileType =
    detectedFileType &&
    (isProcessableImage(file.mimetype) || isProcessableImage(detectedFileType.mime))

  if (shouldUseDetectedFileType && detectedFileType.mime !== file.mimetype) {
    return { ...file, mimetype: detectedFileType.mime }
  }

  return file
}
