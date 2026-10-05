import type { SharpDependency } from '../config/types.js'
import type { PayloadRequest } from '../types/index.js'
import type { ProbedImageSize } from './types.js'

import { probeImageSize, probeImageSizeFromPath } from './probeImageSize.js'

type Args = {
  file: PayloadRequest['file']
  /**
   * The configured `sharp` instance, when available. Preferred for reading
   * dimensions because it covers every format sharp can process. Falls back to
   * the dependency-free probe when sharp is not configured.
   */
  sharp?: SharpDependency
}

export async function getImageSize({ file, sharp }: Args): Promise<ProbedImageSize> {
  // `tempFilePath` may be an empty string when the file is held in memory
  const tempFilePath = file?.tempFilePath || undefined

  if (sharp) {
    try {
      const { height, orientation, width } = await sharp(tempFilePath ?? file!.data).metadata()
      if (width && height) {
        // EXIF orientations 5, 6, 7, and 8 transpose width and height in display / viewer orientation
        if (orientation && [5, 6, 7, 8].includes(orientation)) {
          return { height: width, width: height }
        }
        return { height, width }
      }
    } catch {
      // sharp decodes the full image and rejects truncated/header-only files
      // that the byte-level probe can still measure, so fall through to it
    }
  }

  if (tempFilePath) {
    return probeImageSizeFromPath(tempFilePath)
  }

  return probeImageSize(file!.data)
}
