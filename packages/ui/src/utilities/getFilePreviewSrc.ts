import { isImage } from 'payload/shared'

/**
 * Picks the URL that the upload preview shows, so the toolbar can open and download the same file.
 * The admin thumbnail is often a small variant, so images use the original file instead.
 */
export function getFilePreviewSrc({
  data,
  selectedSizeData,
}: {
  data: Record<string, unknown>
  selectedSizeData?: null | Record<string, unknown>
}): null | string {
  const selectedSizeUrl = selectedSizeData?.url as string | undefined
  const originalUrl = data?.url as string | undefined
  const thumbnailUrl = data?.thumbnailURL as string | undefined
  const isImageFile = isImage((data?.mimeType as string) ?? '')

  if (selectedSizeUrl) {
    return selectedSizeUrl
  }

  if (isImageFile && originalUrl) {
    return originalUrl
  }

  return thumbnailUrl ?? originalUrl ?? null
}
