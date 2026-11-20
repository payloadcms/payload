import { getBestFitFromSizes, isImage } from 'payload/shared'

import { getVideoThumbnailSrc } from './getVideoThumbnailSrc.js'

type GetDocumentThumbnailArgs = {
  doc: Record<string, unknown>
  useAsThumbnail?: string
}

/** Resolve the configured upload using the same thumbnail policy across document cards. */
export function getDocumentThumbnail({
  doc,
  useAsThumbnail,
}: GetDocumentThumbnailArgs): string | undefined {
  const upload = getThumbnailUpload({ doc, useAsThumbnail })

  if (!upload) {
    return undefined
  }

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

/**
 * Resolve the video url to render as a frame when the configured upload is a video
 * without an image preview. Pairs with `getDocumentThumbnail`, which covers every other case.
 */
export function getDocumentVideoThumbnail({
  doc,
  useAsThumbnail,
}: GetDocumentThumbnailArgs): string | undefined {
  const upload = getThumbnailUpload({ doc, useAsThumbnail })

  if (!upload) {
    return undefined
  }

  return getVideoThumbnailSrc({
    mimeType: typeof upload.mimeType === 'string' ? upload.mimeType : undefined,
    thumbnailURL: typeof upload.thumbnailURL === 'string' ? upload.thumbnailURL : undefined,
    url: typeof upload.url === 'string' ? upload.url : undefined,
  })
}

/** Unwrap the `useAsThumbnail` field value (single, hasMany, or polymorphic) to its upload doc. */
function getThumbnailUpload({
  doc,
  useAsThumbnail,
}: GetDocumentThumbnailArgs): Record<string, unknown> | undefined {
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

  return thumbnailDoc as Record<string, unknown>
}
