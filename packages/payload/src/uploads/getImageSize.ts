import type { UploadedFile } from 'express-fileupload'

import fs from 'fs'
import probeImageSize from 'probe-image-size'

import type { ProbedImageSize } from './types'

export default async function (file: UploadedFile): Promise<ProbedImageSize> {
  if (file.tempFilePath) {
    const data = fs.readFileSync(file.tempFilePath)
    return probeImageSize.sync(data)
  }

  return probeImageSize.sync(file.data)
}
