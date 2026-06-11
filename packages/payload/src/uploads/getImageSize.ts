import fs from 'fs/promises'
import { imageSize } from 'image-size'
import { imageSizeFromFile } from 'image-size/fromFile'

import type { PayloadRequest } from '../types/index.js'
import type { ProbedImageSize } from './types.js'

import { temporaryFileTask } from './tempFile.js'

/**
 * Probes the dimensions of an uploaded image.
 *
 * Returns `undefined` when dimensions cannot be determined — e.g. a client-upload
 * storage adapter returned a redirect/empty body, or the buffer is corrupt. This
 * keeps a missing/unreadable body from crashing the upload pipeline (`image-size`
 * throws `RangeError: Offset is outside the bounds of the DataView` on empty input).
 */
export async function getImageSize(
  file: PayloadRequest['file'],
): Promise<ProbedImageSize | undefined> {
  if (file?.tempFilePath) {
    return imageSizeFromFile(file.tempFilePath)
  }

  // No usable bytes to probe (e.g. a client-upload handler returned a 302 redirect).
  if (!file?.data?.length) {
    return undefined
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

  try {
    return imageSize(file.data)
  } catch {
    // Corrupt or unsupported buffer — degrade gracefully rather than failing the upload.
    return undefined
  }
}
