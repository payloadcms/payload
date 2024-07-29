import type { UploadedFile } from 'express-fileupload'
import type { PayloadRequest } from 'payload/types'
import type { SharpOptions } from 'sharp'

import sharp from 'sharp'

import type { UploadEdits } from './types'

import { type WithMetadata, optionallyAppendMetadata } from './optionallyAppendMetadata'

export const percentToPixel = (value, dimension): number => {
  if (!value) return 0
  return Math.floor((parseFloat(value) / 100) * dimension)
}

type CropImageArgs = {
  cropData: UploadEdits['crop']
  dimensions: { height: number; width: number }
  file: UploadedFile
  heightInPixels: number
  req?: PayloadRequest
  widthInPixels: number
  withMetadata?: WithMetadata
}
export async function cropImage({
  cropData,
  dimensions,
  file,
  heightInPixels,
  req,
  widthInPixels,
  withMetadata,
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

    let cropped = sharp(file.tempFilePath || file.data, sharpOptions).extract(formattedCropData)

    cropped = await optionallyAppendMetadata({
      req,
      sharpFile: cropped,
      withMetadata,
    })

    return await cropped.withMetadata().toBuffer({
      resolveWithObject: true,
    })
  } catch (error) {
    console.error(`Error cropping image:`, error)
    throw error
  }
}
