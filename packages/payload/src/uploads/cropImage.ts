// @ts-strict-ignore
import type { SharpOptions } from 'sharp'

import type { SanitizedConfig } from '../config/types.js'
import type { PayloadRequest } from '../types/index.js'
import type { WithMetadata } from './optionallyAppendMetadata.js'
import type { UploadEdits } from './types.js'

import { optionallyAppendMetadata } from './optionallyAppendMetadata.js'

export const percentToPixel = (value, dimension) => {
  return Math.floor((parseFloat(value) / 100) * dimension)
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
  file,
  heightInPixels,
  req,
  sharp,
  widthInPixels,
  withMetadata,
}: CropImageArgs) {
  try {
    const { x, y } = cropData

    const fileIsAnimatedType = ['image/avif', 'image/gif', 'image/webp'].includes(file.mimetype)

    const sharpOptions: SharpOptions = {}

    if (fileIsAnimatedType) {
      sharpOptions.animated = true
    }

    const formattedCropData = {
      height: Number(heightInPixels),
      left: percentToPixel(x, dimensions.width),
      top: percentToPixel(y, dimensions.height),
      width: Number(widthInPixels),
    }

    let cropped = sharp(file.tempFilePath || file.data, sharpOptions).extract(formattedCropData)

    cropped = await optionallyAppendMetadata({
      req,
      sharpFile: cropped,
      withMetadata,
    })

    return await cropped.toBuffer({
      resolveWithObject: true,
    })
  } catch (error) {
    console.error(`Error cropping image:`, error)
    throw error
  }
}
