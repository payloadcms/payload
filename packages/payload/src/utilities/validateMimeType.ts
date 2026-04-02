export const validateMimeType = (mimeType: string, allowedMimeTypes: string[]): boolean => {
  if (allowedMimeTypes.length === 0) {
    return true
  }

  const cleanedMimeTypes = allowedMimeTypes.map((v) => v.replace('*', ''))

  return cleanedMimeTypes.some((cleanedMimeType) => mimeType.startsWith(cleanedMimeType))
}
