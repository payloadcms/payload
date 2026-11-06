/**
 * Returns `true` when the given `mimeType` describes a media file whose type can
 * be reliably detected from its byte contents (`file-type`): images, videos,
 * audio and PDFs.
 *
 * This is broader than `isProcessableImage`, which only covers images that can
 * be resized/processed by Sharp. It is used to decide whether the type sniffed
 * from a file's buffer should be used to correct a wrongly-declared
 * `file.mimetype` (e.g. a video shipped with an incorrect `Content-Type`).
 */
export function isMediaMimeType(mimeType: string): boolean {
  return (
    mimeType.startsWith('image/') ||
    mimeType.startsWith('video/') ||
    mimeType.startsWith('audio/') ||
    mimeType === 'application/pdf'
  )
}

/**
 * Returns the essence (type/subtype) of a MIME type, dropping any parameters
 * such as `codecs` or `charset`. Parameterized declarations like
 * `audio/webm;codecs=opus` can then be compared against a base type.
 */
export function getMimeTypeEssence(mimeType: string): string {
  return mimeType.split(';')[0]?.trim() ?? ''
}
