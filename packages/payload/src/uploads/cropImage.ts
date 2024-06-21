import type { SharpOptions } from 'sharp'

import sharp from 'sharp'

export default async function cropImage({ cropData, file }) {
  try {
    const fileIsAnimatedType = ['image/avif', 'image/gif', 'image/webp'].includes(file.mimetype)

    const { heightPixels, widthPixels, x, y } = cropData

    const sharpOptions: SharpOptions = {}

    if (fileIsAnimatedType) sharpOptions.animated = true

    const formattedCropData: sharp.Region = {
      height: Number(heightPixels),
      left: Number(x),
      top: Number(y),
      width: Number(widthPixels),
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
