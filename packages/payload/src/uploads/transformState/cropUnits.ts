import type { Crop } from '../types.js'

/** A saved crop: integer pixels on the original file. */
export type PixelCrop = Omit<Crop, 'unit'>

type Dimensions = { height: number; width: number }

/** Converts an editor crop to original-file pixels, kept inside the original. */
export function cropToPixels({ crop, original }: { crop: Crop; original: Dimensions }): PixelCrop {
  const scale = (value: number, size: number) =>
    crop.unit === 'px' ? Math.round(value) : Math.round((value / 100) * size)
  const x = Math.min(scale(crop.x, original.width), original.width - 1)
  const y = Math.min(scale(crop.y, original.height), original.height - 1)

  return {
    height: Math.max(1, Math.min(scale(crop.height, original.height), original.height - y)),
    width: Math.max(1, Math.min(scale(crop.width, original.width), original.width - x)),
    x,
    y,
  }
}

/** Converts a saved pixel crop to the percent crop that the editor and Sharp read. */
export function cropToPercent({ crop, original }: { crop: PixelCrop; original: Dimensions }): Crop {
  return {
    height: (crop.height / original.height) * 100,
    unit: '%',
    width: (crop.width / original.width) * 100,
    x: (crop.x / original.width) * 100,
    y: (crop.y / original.height) * 100,
  }
}

/** Whether an editor crop selects the whole image, which means "no crop". */
export const isFullCrop = (crop: Crop): boolean =>
  crop.unit === '%' &&
  Number(crop.width) === 100 &&
  Number(crop.height) === 100 &&
  Number(crop.x) === 0 &&
  Number(crop.y) === 0
