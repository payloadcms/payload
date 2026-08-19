import { getBestFitFromSizes, isImage } from 'payload/shared'

/**
 * Matches the upload thumbnail derivation used by the hierarchy table cells: images resolve to the
 * best fit from the generated sizes, everything else falls back to the configured thumbnail URL.
 */
export function getThumbnailSrc({ doc }: { doc: Record<string, unknown> }): string | undefined {
  const mimeType = doc.mimeType as string | undefined
  const isFileImage = mimeType ? isImage(mimeType) : false

  if (!isFileImage) {
    return doc.thumbnailURL as string
  }

  return getBestFitFromSizes({
    sizes: doc.sizes as Record<string, { url?: string; width?: number }>,
    thumbnailURL: doc.thumbnailURL as string,
    url: doc.url as string,
    width: doc.width as number,
  })
}
