import type { SharpOptions } from 'sharp'

import sharp from 'sharp'

export const percentToPixel = (value: string, dimension: number): number => {
  if (!value) return 0
  return Math.floor((parseFloat(value) / 100) * dimension)
}
export default async function cropImage({ cropData, dimensions, file }) {
  try {
    const fileIsAnimatedType = ['image/avif', 'image/gif', 'image/webp'].includes(file.mimetype)

    const { heightPixels, widthPixels, x, y } = cropData

    const sharpOptions: SharpOptions = {}

    if (fileIsAnimatedType) sharpOptions.animated = true

    const formattedCropData: sharp.Region = {
      height: Number(heightPixels),
      left: percentToPixel(x, dimensions.width),
      top: percentToPixel(y, dimensions.height),
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
