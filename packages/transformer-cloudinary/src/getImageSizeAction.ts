import type { CloudinaryImageSizeOptions } from './types.js'

/**
 * Decides what to do with one configured image size, given the source's dimensions.
 *
 * `withoutEnlargement`:
 * - `undefined` [default]: a source smaller than the target is recorded with null
 *   metadata rather than upscaled - the long-standing Payload `sizes` behavior
 * - `false`: always enlarge to the target size
 * - `true`: deliver the source at its own size instead of enlarging
 */
export function getImageSizeAction({
  dimensions,
  size,
}: {
  dimensions: { height: number; width: number }
  size: CloudinaryImageSizeOptions
}): 'omit' | 'resize' {
  if (size.withoutEnlargement !== undefined) {
    return 'resize'
  }

  const { height: targetHeight, width: targetWidth } = size

  if (targetWidth !== undefined && targetHeight !== undefined) {
    return dimensions.width < targetWidth && dimensions.height < targetHeight ? 'omit' : 'resize'
  }

  if (targetWidth !== undefined && dimensions.width < targetWidth) {
    return 'omit'
  }

  if (targetHeight !== undefined && dimensions.height < targetHeight) {
    return 'omit'
  }

  return 'resize'
}
