import fs from 'fs'
import probeImageSize from 'probe-image-size'

import type { PayloadRequest } from '../types/index.js'
import type { ProbedImageSize } from './types.js'

export function getImageSize(file: PayloadRequest['file']): ProbedImageSize {
  if (file.tempFilePath) {
    const data = fs.readFileSync(file.tempFilePath)
    return probeImageSize.sync(data)
  }

  return probeImageSize.sync(file.data)
}
