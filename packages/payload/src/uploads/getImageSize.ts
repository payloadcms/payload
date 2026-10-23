import type { SharpDependency } from '../config/types.js'
import type { PayloadRequest } from '../types/index.js'
import type { ProbedImageSize } from './types.js'
import type { UploadFile } from './uploadFile.js'

import { getFileBufferOrPath, getFileSource } from './fileSource.js'
import { probeImageSize, probeImageSizeFromPath } from './probeImageSize.js'

type Args = {
  file: PayloadRequest['file'] | UploadFile
  /**
   * The configured `sharp` instance, when available. Preferred for reading
   * dimensions because it covers every format sharp can process. Falls back to
   * the dependency-free probe when sharp is not configured.
   */
  sharp?: SharpDependency
}

export async function getImageSize({ file, sharp }: Args): Promise<ProbedImageSize> {
  const source = getFileSource(file!)

  if (source.type === 'clientUpload') {
    if (!source.probe) {
      throw new Error('Image dimensions require a probe or materialized client upload.')
    }
    return probeImageSize(source.probe)
  }

  if (sharp) {
    try {
      const { height, width } = await sharp(getFileBufferOrPath(source)).metadata()
      if (width && height) {
        return { height, width }
      }
    } catch {
      // sharp decodes the full image and rejects truncated/header-only files
      // that the byte-level probe can still measure, so fall through to it
    }
  }

  if (source.type === 'file') {
    return probeImageSizeFromPath(source.path)
  }

  return probeImageSize(source.buffer)
}
