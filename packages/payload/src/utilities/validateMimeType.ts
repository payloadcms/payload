export const validateMimeType = (mimeType: string, allowedMimeTypes: string[]): boolean => {
  const cleanedMimeTypes = allowedMimeTypes.map((v) => v.replace('*', ''))
  return cleanedMimeTypes.some((cleanedMimeType) => mimeType.startsWith(cleanedMimeType))
}
