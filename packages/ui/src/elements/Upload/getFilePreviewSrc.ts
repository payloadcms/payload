import { isImage } from 'payload/shared'

type FileSrcArgs = {
  data: Record<string, unknown>
  selectedSizeData?: null | Record<string, unknown>
}

/**
 * Picks the image the upload preview shows.
 * The admin thumbnail is often a small variant, so images the browser can show use the original file instead.
 */
export function getFilePreviewSrc({ data, selectedSizeData }: FileSrcArgs): null | string {
  const { originalUrl, selectedSizeUrl, thumbnailUrl } = getUrls({ data, selectedSizeData })
  const mimeType = (data?.mimeType as string) ?? ''
  const canBrowserShowOriginal = isImage(mimeType) && mimeType !== 'image/jxl'

  if (selectedSizeUrl) {
    return selectedSizeUrl
  }

  if (canBrowserShowOriginal && originalUrl) {
    return originalUrl
  }

  return thumbnailUrl ?? originalUrl ?? null
}

/**
 * Picks the file the toolbar opens and downloads: the selected size, or else the original file.
 */
export function getFileDownloadSrc({ data, selectedSizeData }: FileSrcArgs): null | string {
  const { originalUrl, selectedSizeUrl, thumbnailUrl } = getUrls({ data, selectedSizeData })

  return selectedSizeUrl ?? originalUrl ?? thumbnailUrl ?? null
}

function getUrls({ data, selectedSizeData }: FileSrcArgs) {
  return {
    originalUrl: (data?.url as null | string | undefined) || undefined,
    selectedSizeUrl: (selectedSizeData?.url as null | string | undefined) || undefined,
    thumbnailUrl: (data?.thumbnailURL as null | string | undefined) || undefined,
  }
}
