export const validateMimeType = (
  mimeType: string,
  allowedMimeTypes: string[],
  ext?: boolean,
): boolean => {
  const cleanedMimeTypes = allowedMimeTypes.map((v) => v.replace('*', ''))
  if (allowedMimeTypes.length === 0) {
    return true
  }

  const startsWithMatch = cleanedMimeTypes.some((cleanedMimeType) =>
    mimeType.startsWith(cleanedMimeType),
  )
  if (startsWithMatch) {
    return true
  }

  if (ext) {
    return cleanedMimeTypes.some((cleanedMimeType) => cleanedMimeType.includes(mimeType))
  }

  return false
}
