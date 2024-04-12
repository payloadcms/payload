import fs from 'fs'
import sizeOfImport from 'image-size'
import { temporaryFileTask } from 'tempy'
import { promisify } from 'util'

import type { PayloadRequest } from '../types/index.js'
import type { ProbedImageSize } from './types.js'

const { imageSize } = sizeOfImport
const imageSizePromise = promisify(imageSize)

export async function getImageSize(file: PayloadRequest['file']): Promise<ProbedImageSize> {
  if (file.tempFilePath) {
    return imageSizePromise(file.tempFilePath)
  }

  // Tiff file do not support buffers or streams, so we must write to file first
  // then retrieve dimensions. https://github.com/image-size/image-size/issues/103
  if (file.mimetype === 'image/tiff') {
    const dimensions = await temporaryFileTask(
      async (filepath) => {
        fs.writeFileSync(filepath, file.data)
        return imageSizePromise(filepath)
      },
      { extension: 'tiff' },
    )
    return dimensions
  }

  return imageSize(file.data)
}
