import fs from 'fs/promises'

import type { SharpDependency } from '../config/types.js'
import type { PayloadRequest } from '../types/index.js'
import type { ProbedImageSize } from './types.js'

import { probeImageSize } from './probeImageSize.js'

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
      const { height, width } = await sharp(tempFilePath ?? file!.data).metadata()
      if (width && height) {
        return { height, width }
      }
    } catch {
      // sharp decodes the full image and rejects truncated/header-only files
      // that the byte-level probe can still measure, so fall through to it
    }
  }

  const data = tempFilePath ? await fs.readFile(tempFilePath) : file!.data

  return probeImageSize(data)
}
