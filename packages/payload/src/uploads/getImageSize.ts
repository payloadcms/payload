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
  if (sharp) {
    const input = file?.tempFilePath ?? file!.data
    const { height, width } = await sharp(input).metadata()
    if (width && height) {
      return { height, width }
    }
  }

  const data = file?.tempFilePath ? await fs.readFile(file.tempFilePath) : file!.data

  return probeImageSize(data)
}
