import type { SharpOptions } from 'sharp'

export const percentToPixel = (value, dimension) => {
  return Math.floor((parseFloat(value) / 100) * dimension)
}

export async function cropImage({ cropData, dimensions, file, sharp }) {
  try {
    const { heightPixels, widthPixels, x, y } = cropData

    const fileIsAnimatedType = ['image/avif', 'image/gif', 'image/webp'].includes(file.mimetype)

    const sharpOptions: SharpOptions = {}

    if (fileIsAnimatedType) sharpOptions.animated = true

    const formattedCropData = {
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
