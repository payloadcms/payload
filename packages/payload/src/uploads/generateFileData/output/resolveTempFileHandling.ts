export type TempFileHandling =
  | { sourcePath: string; type: 'copyFromTempFile' }
  | { type: 'skip' }
  | { type: 'useBuffer' }

/**
 * Decides how to get a file's bytes onto disk when no transformer rewrote it (a transformed
 * file is already an in-memory buffer, so it always takes the `useBuffer` path). Copies straight
 * from the temp file when possible, rather than reading a potentially large temp file into memory
 * just to write it back out - see the `generateFileData` function doc for why.
 */
export const resolveTempFileHandling = ({
  disableLocalStorage,
  hasProcessedBuffer,
  tempFilePath,
}: {
  disableLocalStorage: boolean
  hasProcessedBuffer: boolean
  tempFilePath: string | undefined
}): TempFileHandling => {
  if (hasProcessedBuffer || !tempFilePath) {
    return { type: 'useBuffer' }
  }

  return disableLocalStorage
    ? { type: 'skip' }
    : { type: 'copyFromTempFile', sourcePath: tempFilePath }
}
