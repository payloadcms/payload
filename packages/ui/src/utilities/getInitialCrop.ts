import type { Crop, CropMode, UploadEdits } from 'payload'

export const getInitialCrop = ({
  cropMode,
  data,
  uploadEdits,
}: {
  cropMode?: CropMode
  data?: null | Record<string, unknown>
  uploadEdits?: UploadEdits
}): Crop | undefined => {
  if (uploadEdits?.crop) {
    return uploadEdits.crop
  }

  if (cropMode === 'preserve') {
    return data?.cropRect as Crop | undefined
  }

  return undefined
}
