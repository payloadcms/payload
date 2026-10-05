import type { CropTransform, UploadEdits } from 'payload'

export function toPercentCrop({
  crop,
  height,
  width,
}: {
  crop: CropTransform
  height: number
  width: number
}): NonNullable<UploadEdits['crop']> {
  return {
    height: (crop.height / height) * 100,
    unit: '%',
    width: (crop.width / width) * 100,
    x: (crop.x / width) * 100,
    y: (crop.y / height) * 100,
  }
}

export function toPixelCrop({
  crop,
  height,
  width,
}: {
  crop: NonNullable<UploadEdits['crop']>
  height: number
  width: number
}): CropTransform {
  const x = Math.max(0, Math.min(width - 1, Math.round((crop.x / 100) * width)))
  const y = Math.max(0, Math.min(height - 1, Math.round((crop.y / 100) * height)))

  return {
    height: Math.max(1, Math.min(height - y, Math.round((crop.height / 100) * height))),
    width: Math.max(1, Math.min(width - x, Math.round((crop.width / 100) * width))),
    x,
    y,
  }
}
