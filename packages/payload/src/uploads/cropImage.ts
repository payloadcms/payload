import sharp from 'sharp'

export const percentToPixel = (value: string, dimension: number): number => {
  if (!value) return 0
  return Math.floor((parseFloat(value) / 100) * dimension)
}

export default async function cropImage({ cropData, dimensions, file }) {
  try {
    const { height, width, x, y } = cropData

    const formattedCropData: sharp.Region = {
      height: percentToPixel(height, dimensions.height),
      left: percentToPixel(x, dimensions.width),
      top: percentToPixel(y, dimensions.height),
      width: percentToPixel(width, dimensions.width),
    }

    const cropped = sharp(file.tempFilePath || file.data).extract(formattedCropData)

    return await cropped.toBuffer({
      resolveWithObject: true,
    })
  } catch (error) {
    console.error(`Error cropping image:`, error)
    throw error
  }
}
