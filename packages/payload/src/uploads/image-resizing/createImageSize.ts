/**
 * Create the result object for the image resize operation based on the
 * provided parameters. If the name is not provided, an empty result object
 * is returned.
 *
 * @param filename - the filename of the image
 * @param width - the width of the image
 * @param height - the height of the image
 * @param filesize - the filesize of the image
 * @param mimeType - the mime type of the image
 * @returns a FileSize result object
 */

import type { FileSize } from '../types.js'

type CreateResultArgs = {
  filename?: FileSize['filename']
  filesize?: FileSize['filesize']
  height?: FileSize['height']
  mimeType?: FileSize['mimeType']
  url?: FileSize['url']
  width?: FileSize['width']
}
export const createImageSize = ({
  filename = null,
  filesize = null,
  height = null,
  mimeType = null,
  url = null,
  width = null,
}: CreateResultArgs): FileSize => {
  return {
    filename,
    filesize,
    height,
    mimeType,
    url,
    width,
  }
}
