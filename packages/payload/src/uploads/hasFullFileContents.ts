/**
 * True when the upload's bytes are fully available for processing - either wholly in-memory
 * (data.length matches the declared size) or wholly on disk at tempFilePath with no partial
 * in-memory probe alongside it. Bounded header-only probes returned by
 * getFileFromUploadInstructions therefore report false, so callers can gate Sharp routing on
 * complete content.
 */
export function hasFullFileContents(file: {
  data: Buffer
  size: number
  tempFilePath?: string
}): boolean {
  const isCompleteTempFile = Boolean(file.tempFilePath) && (!file.data || file.data.length === 0)
  return isCompleteTempFile || file.data.length === file.size
}
