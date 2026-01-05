import type { Metadata as SharpMetadata } from 'sharp'

/**
 * Used to extract height from images, animated or not.
 *
 * @param sharpMetadata - the sharp metadata
 * @returns the height of the image
 */
export function extractHeightFromImage(sharpMetadata: SharpMetadata): number {
  if (sharpMetadata?.pages) {
    return sharpMetadata.height! / sharpMetadata.pages
  }
  return sharpMetadata.height!
}
