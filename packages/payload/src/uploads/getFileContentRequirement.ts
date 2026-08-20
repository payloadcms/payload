import type { SanitizedUploadConfig } from './types.js'

import { canResizeImage } from './canResizeImage.js'
import { isAnimatedImage } from './isAnimatedImage.js'
import { isImage } from './isImage.js'

/**
 * Bytes read from the start of a file to sniff its mime type and, for images, probe its
 * dimensions. Generous enough to cover real-world header/metadata layouts (EXIF, ICC
 * profiles, etc.) while staying tiny next to a multi-gigabyte upload.
 */
export const HEADER_PROBE_BYTE_LENGTH = 1024 * 1024

export type FileContentRequirement = 'full' | 'header' | 'none'

/**
 * Decides how much of an uploaded file's content, if any, is needed to save the document -
 * so a client upload (e.g. Azure's chunkLargeFiles) only pays for what post-processing
 * actually reads instead of always being re-downloaded in full.
 *
 * - `full`: local storage needs the real bytes, or the file will be resized/reformatted/
 *   trimmed/animated, or additional image sizes will be generated from it, or the collection
 *   restricts mime types (which also runs SVG/PDF content-safety checks that must see the
 *   whole file).
 * - `header`: the file is an image and only its dimensions are needed.
 * - `none`: nothing downstream reads file content at all.
 */
export function getFileContentRequirement({
  mimeType,
  uploadConfig,
}: {
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

  if ((isResizableImage && hasConfiguredAdjustments) || isAnimatedImage(mimeType)) {
    return 'full'
  }

  if (isResizableImage || isImage(mimeType)) {
    return 'header'
  }

  return 'none'
}
