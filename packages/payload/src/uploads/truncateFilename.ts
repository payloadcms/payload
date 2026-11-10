import { UploadFilenameError } from '../errors/UploadFilenameError.js'

/** Keeps upload filenames within the filesystem component limit without splitting UTF-8 characters. */
export const truncateFilename = ({
  filename,
  maxBytes = 255,
}: {
  filename: string
  maxBytes?: number
}): string => {
  const extensionIndex = filename.lastIndexOf('.')
  const hasExtension = extensionIndex > 0
  const extension = hasExtension ? filename.slice(extensionIndex) : ''

  if (Buffer.byteLength(extension) > maxBytes) {
    throw new UploadFilenameError({
      message: 'Upload filename extension exceeds the filename byte limit',
      status: 400,
    })
  }

  const stem = hasExtension ? filename.slice(0, extensionIndex) : filename
  // Keep collision numbering intact when shortening the stem.
  const existingSuffix = stem.match(/-\d+$/)?.[0] ?? ''
  const basename = existingSuffix ? stem.slice(0, -existingSuffix.length) : stem
  const tail = `${existingSuffix}${extension}`
  const availableBytes = maxBytes - Buffer.byteLength(tail)

  if (availableBytes < 0) {
    throw new UploadFilenameError({
      message: 'Unable to find an available upload filename',
      status: 409,
    })
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
