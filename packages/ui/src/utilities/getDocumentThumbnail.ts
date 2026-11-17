import { getBestFitFromSizes, isImage } from 'payload/shared'

/** Resolve the configured upload using the same thumbnail policy across document cards. */
export function getDocumentThumbnail({
  doc,
  useAsThumbnail,
}: {
  doc: Record<string, unknown>
  useAsThumbnail?: string
}): string | undefined {
  const value = useAsThumbnail ? doc[useAsThumbnail] : undefined
  const firstValue = Array.isArray(value) ? value[0] : value
  const candidate = Array.isArray(value)
    ? firstValue
    : firstValue && typeof firstValue === 'object'
      ? firstValue
      : doc
  const thumbnailDoc =
    candidate && typeof candidate === 'object' && 'relationTo' in candidate && 'value' in candidate
      ? candidate.value
      : candidate

  if (!thumbnailDoc || typeof thumbnailDoc !== 'object') {
    return undefined
  }

  const upload = thumbnailDoc as Record<string, unknown>
  const thumbnailURL = typeof upload.thumbnailURL === 'string' ? upload.thumbnailURL : undefined
  const mimeType = typeof upload.mimeType === 'string' ? upload.mimeType : undefined

  if (mimeType && isImage(mimeType)) {
    return (
      getBestFitFromSizes({
        sizes: upload.variants as Record<string, { url?: string; width?: number }>,
        thumbnailURL,
        url: typeof upload.url === 'string' ? upload.url : '',
        width: typeof upload.width === 'number' ? upload.width : undefined,
      }) || undefined
    )
  }

  return thumbnailURL || undefined
}
