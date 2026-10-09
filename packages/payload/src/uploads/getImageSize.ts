import fs from 'node:fs/promises'

import type { PayloadRequest } from '../types/index.js'
import type { ProbedImageSize } from './types.js'

import { getImageOrientation } from './getImageOrientation.js'
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
    const dimensions = await probeImageSizeFromPath(tempFilePath)
    const handle = await fs.open(tempFilePath, 'r')

    try {
      const header = Buffer.alloc(65536)
      const { bytesRead } = await handle.read(header, 0, header.length, 0)
      const orientation = getImageOrientation({ data: header.subarray(0, bytesRead) })

      return orientation && orientation >= 5
        ? { height: dimensions.width, width: dimensions.height }
        : dimensions
    } finally {
      await handle.close()
    }
  }

  const dimensions = probeImageSize(file!.data)
  const orientation = getImageOrientation({ data: file!.data })

  return orientation && orientation >= 5
    ? { height: dimensions.width, width: dimensions.height }
    : dimensions
}
