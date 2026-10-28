import type { UploadEdits } from 'payload'

import { cropToPercent } from 'payload/shared'

type SavedCrop = { height: number; width: number; x: number; y: number }

/**
 * The editor's starting crop: unsaved edits first, then the saved crop on the original. The saved
 * crop belongs to the stored file, so a newly selected file starts without it.
 */
export const getInitialCrop = ({
  data,
  hasSelectedFile,
  uploadEdits,
}: {
  data?: {
    _transforms?: { crop?: SavedCrop } | null
    original?: { height?: null | number; width?: null | number } | null
  }
  hasSelectedFile?: boolean
  uploadEdits?: UploadEdits
}): UploadEdits['crop'] => {
  if (uploadEdits?.crop) {
    return uploadEdits.crop
  }

  if (hasSelectedFile) {
    return undefined
  }

  const savedCrop = data?._transforms?.crop
  const { height, width } = data?.original ?? {}

  return savedCrop && height && width
    ? cropToPercent({ crop: savedCrop, original: { height, width } })
    : undefined
}
