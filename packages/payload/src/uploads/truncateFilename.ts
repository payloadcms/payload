/** Keeps upload filenames within the filesystem component limit without splitting UTF-8 characters. */
export const truncateFilename = ({
  filename,
  maxBytes = 255,
  suffix = '',
}: {
  filename: string
  maxBytes?: number
  suffix?: string
}): string => {
  const extensionIndex = filename.lastIndexOf('.')
  const hasExtension = extensionIndex > 0
  const extension = hasExtension ? filename.slice(extensionIndex) : ''
  const stem = hasExtension ? filename.slice(0, extensionIndex) : filename
  // Keep generated original markers and collision numbering intact when shortening the stem.
  const existingSuffix = stem.match(/(?:-original)?(?:-\d+)?$/)?.[0] ?? ''
  const basename = existingSuffix ? stem.slice(0, -existingSuffix.length) : stem
  const tail = `${existingSuffix}${suffix}${extension}`
  const availableBytes = maxBytes - Buffer.byteLength(tail)

  if (availableBytes < 0) {
    throw new Error('Upload filename suffix and extension exceed the filename byte limit')
  }

  let truncatedStem = ''
  let byteLength = 0

  for (const character of basename) {
    byteLength += Buffer.byteLength(character)

    if (byteLength > availableBytes) {
      break
    }

    truncatedStem += character
  }

  return `${truncatedStem}${tail}`
}
