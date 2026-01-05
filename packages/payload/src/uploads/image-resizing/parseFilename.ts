import sanitize from 'sanitize-filename'

type SanitizedImageData = {
  ext: string
  name: string
}

/**
 * Sanitize the image name and extract the extension from the source image
 *
 * @param sourceImage - the source image
 * @returns the sanitized name and extension
 */
export const parseFilename = (sourceImage: string): SanitizedImageData => {
  const extension = sourceImage.split('.').pop()
  const name = sanitize(sourceImage.substring(0, sourceImage.lastIndexOf('.')) || sourceImage)
  return { name, ext: extension! }
}
