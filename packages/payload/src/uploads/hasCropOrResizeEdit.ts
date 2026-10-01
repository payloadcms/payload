import type { UploadEdits } from './types.js'

/**
 * Whether upload edits change the image's pixel dimensions (crop or an explicit resize), as
 * opposed to `focalPoint`, which does not.
 */
export const hasCropOrResizeEdit = (uploadEdits: undefined | UploadEdits): boolean =>
  Boolean(uploadEdits?.crop || uploadEdits?.heightInPixels || uploadEdits?.widthInPixels)
