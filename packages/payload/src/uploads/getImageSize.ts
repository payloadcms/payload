import { imageSize } from 'image-size'

import type { PayloadRequest } from '../types/index.js'
import type { ProbedImageSize } from './types.js'

export function getImageSize(file: PayloadRequest['file']): ProbedImageSize {
  if (file.tempFilePath) {
    const dimensions = imageSize(file.tempFilePath)
    return { height: dimensions.height, width: dimensions.width }
  }

  const buffer = Buffer.from(file.data)
  const dimensions = imageSize(buffer)
  return { height: dimensions.height, width: dimensions.width }
}
