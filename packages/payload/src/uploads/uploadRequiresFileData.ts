import type { SanitizedUploadConfig, UploadEdits } from './types.js'

import { canResizeImage } from './canResizeImage.js'

const animatedMimeTypes = ['image/avif', 'image/gif', 'image/webp']

/**
 * Determines whether the server needs the file's bytes to process an upload.
 *
 * For client uploads the bytes live in object storage, so the only reason to pull
 * them back into the server is server-side image work (probing aside). When this
 * returns `false` and the client supplied dimensions, the caller can skip both the
 * `staticHandler` fetch-back and `getImageSize`.
 *
 * Mirrors the byte-touching branches in `generateFileData`:
 * - sharp adjustments (`resizeOptions`/`formatOptions`/`trimOptions`/`constructorOptions`)
 * - animated-image processing
 * - `imageSizes` generation (`createImageSizes`)
 * - crop edits (`cropImage`)
 *
 * `focalPoint` alone does not require bytes — only `focalX`/`focalY` are stored.
 */
export function uploadRequiresFileData({
  hasSharp,
  mimeType,
  uploadConfig,
  uploadEdits,
}: {
  hasSharp: boolean
  mimeType: string
  uploadConfig: SanitizedUploadConfig
  uploadEdits?: UploadEdits
}): boolean {
  // Without sharp, no server-side image processing happens regardless of config.
  if (!hasSharp) {
    return false
  }

  // Animated images are always passed through sharp.
  if (animatedMimeTypes.includes(mimeType)) {
    return true
  }

  // Non-resizable mimetypes never trigger sharp work.
  if (!canResizeImage(mimeType)) {
    return false
  }

  const hasImageSizes = Array.isArray(uploadConfig.imageSizes) && uploadConfig.imageSizes.length > 0
  const hasAdjustments = Boolean(
    uploadConfig.resizeOptions ||
      uploadConfig.formatOptions ||
      uploadConfig.trimOptions ||
      uploadConfig.constructorOptions,
  )
  const hasCrop = Boolean(uploadEdits?.crop)

  return hasImageSizes || hasAdjustments || hasCrop
}
