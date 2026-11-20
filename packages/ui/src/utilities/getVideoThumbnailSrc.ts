/** Seconds into the video to show, which skips a black or fade-in first frame. */
export const VIDEO_FRAME_TIME = 0.1

/** Time to wait for a video to load before showing a fallback. */
export const VIDEO_LOAD_TIMEOUT_MS = 5000

export function isVideoMimeType(mimeType: string | undefined): boolean {
  return typeof mimeType === 'string' && mimeType.startsWith('video/')
}

/**
 * Returns the video file url to render as a thumbnail frame, or `undefined` when the
 * file is not a video or already has an image thumbnail (e.g. from `adminThumbnail`).
 */
export function getVideoThumbnailSrc({
  mimeType,
  thumbnailURL,
  url,
}: {
  mimeType: string | undefined
  thumbnailURL: string | undefined
  url: string | undefined
}): string | undefined {
  if (thumbnailURL || !url || !isVideoMimeType(mimeType)) {
    return undefined
  }

  return url
}
