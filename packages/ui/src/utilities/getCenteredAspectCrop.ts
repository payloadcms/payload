import type { UploadEdits } from 'payload'

/**
 * Returns the largest percentage-based crop with the given aspect ratio that fits inside
 * an image of the given pixel dimensions, centered on the image.
 */
export const getCenteredAspectCrop = ({
  aspectRatio,
  imageHeight,
  imageWidth,
}: {
  aspectRatio: number
  imageHeight: number
  imageWidth: number
}): UploadEdits['crop'] => {
  const imageAspectRatio = imageWidth / imageHeight
  const isWiderThanImage = aspectRatio > imageAspectRatio

  const width = isWiderThanImage ? 100 : 100 * (aspectRatio / imageAspectRatio)
  const height = isWiderThanImage ? 100 * (imageAspectRatio / aspectRatio) : 100

  return {
    height,
    unit: '%',
    width,
    x: (100 - width) / 2,
    y: (100 - height) / 2,
  }
}
