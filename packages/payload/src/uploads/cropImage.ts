import type { SharpOptions } from 'sharp'

import type { SanitizedConfig } from '../config/types.js'
import type { PayloadRequest } from '../types/index.js'
import type { WithMetadata } from './optionallyAppendMetadata.js'
import type { UploadEdits } from './types.js'

import { optionallyAppendMetadata } from './optionallyAppendMetadata.js'

const percentToPixel = (value: number, dimension: number) => {
  return Math.floor((value / 100) * dimension)
}

type CropImageArgs = {
  cropData: UploadEdits['crop']
  dimensions: { height: number; width: number }
  file: PayloadRequest['file']
  heightInPixels: number
  req?: PayloadRequest
  sharp: SanitizedConfig['sharp']
  widthInPixels: number
  withMetadata?: WithMetadata
}
export async function cropImage({
  cropData,
  dimensions,
  file: fileArg,
  heightInPixels,
  req,
  sharp,
  widthInPixels,
  withMetadata,
}: CropImageArgs) {
  try {
    const { x, y } = cropData!
    const file = fileArg!

    const fileIsAnimatedType = ['image/avif', 'image/gif', 'image/webp'].includes(file.mimetype)

    const sharpOptions: SharpOptions = {}

    if (fileIsAnimatedType) {
      sharpOptions.animated = true
    }

    const { height: originalHeight, width: originalWidth } = dimensions
    const newWidth = Number(widthInPixels)
    const newHeight = Number(heightInPixels)

    const dimensionsChanged = originalWidth !== newWidth || originalHeight !== newHeight

    if (!dimensionsChanged) {
      let adjustedHeight = originalHeight

      if (fileIsAnimatedType) {
        const animatedMetadata = await sharp(
          file.tempFilePath || file.data,
          sharpOptions,
        ).metadata()
        adjustedHeight = animatedMetadata.pages ? animatedMetadata.height! : originalHeight
      }

      return {
        data: file.data,
        info: {
          height: adjustedHeight,
          size: file.size,
          width: originalWidth,
        },
      }
    }

    const formattedCropData = {
      height: Number(heightInPixels),
      left: percentToPixel(x, dimensions.width),
      top: percentToPixel(y, dimensions.height),
      width: Number(widthInPixels),
    }

    let cropped = sharp(file.tempFilePath || file.data, sharpOptions).extract(formattedCropData)

    cropped = await optionallyAppendMetadata({
      req: req!,
      sharpFile: cropped,
      withMetadata: withMetadata!,
    })

    return await cropped.toBuffer({
      resolveWithObject: true,
    })
  } catch (error) {
    console.error(`Error cropping image:`, error)
    throw error
  }
}
