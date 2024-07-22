import type { SharpOptions } from 'sharp'

import type { SanitizedConfig } from '../config/types.js'
import type { PayloadRequest } from '../types/index.js'
import type { UploadEdits } from './types.js'

export const percentToPixel = (value, dimension) => {
  return Math.floor((parseFloat(value) / 100) * dimension)
}

type CropImageArgs = {
  cropData: UploadEdits['crop']
  dimensions: { height: number; width: number }
  file: PayloadRequest['file']
  heightInPixels: number
  sharp: SanitizedConfig['sharp']
  widthInPixels: number
}
export async function cropImage({
  cropData,
  dimensions,
  file,
  heightInPixels,
  sharp,
  widthInPixels,
}: CropImageArgs) {
  try {
    const { x, y } = cropData

    const fileIsAnimatedType = ['image/avif', 'image/gif', 'image/webp'].includes(file.mimetype)

    const sharpOptions: SharpOptions = {}

    if (fileIsAnimatedType) sharpOptions.animated = true

    const formattedCropData = {
      height: Number(heightInPixels),
      left: percentToPixel(x, dimensions.width),
      top: percentToPixel(y, dimensions.height),
      width: Number(widthInPixels),
    }

    const cropped = sharp(file.tempFilePath || file.data, sharpOptions).extract(formattedCropData)

    return await cropped.toBuffer({
      resolveWithObject: true,
    })
  } catch (error) {
    console.error(`Error cropping image:`, error)
    throw error
  }
}
