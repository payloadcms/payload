// @ts-strict-ignore
import fs from 'fs/promises'
import { imageSize } from 'image-size'
import { imageSizeFromFile } from 'image-size/fromFile'

import type { PayloadRequest } from '../types/index.js'
import type { ProbedImageSize } from './types.js'

import { temporaryFileTask } from './tempFile.js'

export async function getImageSize(file: PayloadRequest['file']): Promise<ProbedImageSize> {
  if (file.tempFilePath) {
    return imageSizeFromFile(file.tempFilePath)
  }

  // Tiff file do not support buffers or streams, so we must write to file first
  // then retrieve dimensions. https://github.com/image-size/image-size/issues/103
  if (file.mimetype === 'image/tiff') {
    const dimensions = await temporaryFileTask(
      async (filepath: string) => {
        await fs.writeFile(filepath, file.data)
        return imageSizeFromFile(filepath)
      },
      { extension: 'tiff' },
    )
    return dimensions
  }

  return imageSize(file.data)
}
