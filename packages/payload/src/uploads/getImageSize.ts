import type { PayloadRequest } from '../types/index.js'
import type { ProbedImageSize } from './types.js'

import { probeImageSize, probeImageSizeFromPath } from './probeImageSize.js'

/**
 * Reads an uploaded file's dimensions via the dependency-free probe. Throws
 * if the buffer isn't a recognized/parseable image format — callers that
 * don't already know the file is an image should catch and ignore.
 */
export async function getImageSize({
  file,
}: {
  file: PayloadRequest['file']
}): Promise<ProbedImageSize> {
  // `tempFilePath` may be an empty string when the file is held in memory
  const tempFilePath = file?.tempFilePath || undefined

  if (tempFilePath) {
    return probeImageSizeFromPath(tempFilePath)
  }

  return probeImageSize(file!.data)
}
