import type { UploadEdits } from 'payload'

import { cropToPercent } from 'payload/shared'

type SavedCrop = { height: number; width: number; x: number; y: number }

/** The editor's starting crop: unsaved edits first, then the saved crop on the original. */
export const getInitialCrop = ({
  data,
  uploadEdits,
}: {
  data?: {
    _transforms?: { crop?: SavedCrop } | null
    original?: { height?: null | number; width?: null | number } | null
  }
  uploadEdits?: UploadEdits
}): UploadEdits['crop'] => {
  if (uploadEdits?.crop) {
    return uploadEdits.crop
  }

  const savedCrop = data?._transforms?.crop
  const { height, width } = data?.original ?? {}

  return savedCrop && height && width
    ? cropToPercent({ crop: savedCrop, original: { height, width } })
    : undefined
}
