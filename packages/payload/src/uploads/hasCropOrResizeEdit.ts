import type { UploadEdits } from './types.js'

/**
 * Whether upload edits change the image's pixel dimensions (crop or an explicit resize), as
 * opposed to `focalPoint`, which does not.
 */
export const hasCropOrResizeEdit = (uploadEdits: undefined | UploadEdits): boolean => {
  if (!uploadEdits) {
    return false
  }

  const { crop, heightInPixels, widthInPixels } = uploadEdits

  const hasMeaningfulCrop =
    Boolean(crop) &&
    !(
      crop?.unit === '%' &&
      crop?.x === 0 &&
      crop?.y === 0 &&
      crop?.width === 100 &&
      crop?.height === 100
    )

  return Boolean(hasMeaningfulCrop || heightInPixels || widthInPixels)
}
