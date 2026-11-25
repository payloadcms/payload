import { getMimeTypeEssence, isSvgUpload, isXmlUpload } from './getFileTypeIdentity.js'
import { isISOBaseMediaMimeType } from './validateISOBaseMediaFile.js'

/**
 * Whether the content checks of a file can run over a few byte ranges instead of the whole file:
 * a video, or ISO base media that is not an image. Its type is found from the first bytes, and the
 * ISO base media box check reads one header for each top-level box. SVG, XML and PDF checks read
 * the whole file. An ISO base media image keeps the full download, because its type check and its
 * dimensions use other paths.
 */
export function canCheckContentsByRanges({
  filename,
  mimeType,
}: {
  filename: string
  mimeType: string
}): boolean {
  if (isSvgUpload({ filename, mimeType }) || isXmlUpload({ filename, mimeType })) {
    return false
  }

  const mimeTypeEssence = getMimeTypeEssence(mimeType)

  return (
    mimeTypeEssence.startsWith('video/') ||
    (isISOBaseMediaMimeType(mimeTypeEssence) && !mimeTypeEssence.startsWith('image/'))
  )
}
