import type { SanitizedUploadConfig } from './types.js'

import { canResizeImage } from './canResizeImage.js'
import { isAnimatedImage } from './isAnimatedImage.js'
import { isImage } from './isImage.js'

export const HEADER_PROBE_BYTE_LENGTH = 1024 * 1024

export type FileContentRequirement = 'full' | 'header' | 'none'

export function getFileContentRequirement({
  hasSizeEdits,
  mimeType,
  uploadConfig,
}: {
  hasSizeEdits?: boolean
  mimeType: string
  uploadConfig: SanitizedUploadConfig
}): FileContentRequirement {
  if (!uploadConfig.disableLocalStorage) {
    return 'full'
  }

  const hasMimeTypeAllowList =
    !uploadConfig.allowRestrictedFileTypes &&
    Array.isArray(uploadConfig.mimeTypes) &&
    uploadConfig.mimeTypes.length > 0

  if (hasMimeTypeAllowList) {
    return 'full'
  }

  const isResizableImage = canResizeImage(mimeType)
  const hasConfiguredAdjustments = Boolean(
    uploadConfig.resizeOptions ||
      uploadConfig.formatOptions ||
      uploadConfig.trimOptions ||
      uploadConfig.constructorOptions ||
      (Array.isArray(uploadConfig.imageSizes) && uploadConfig.imageSizes.length > 0),
  )

  if (hasSizeEdits || (isResizableImage && hasConfiguredAdjustments) || isAnimatedImage(mimeType)) {
    return 'full'
  }

  if (isResizableImage || isImage(mimeType)) {
    return 'header'
  }

  return 'none'
}
