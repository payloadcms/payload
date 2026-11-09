import { formatFilesize } from './formatFilesize.js'

/**
 * Formats a file's size, dimensions and MIME type for display, for example "12.3KB - 800x600 -
 * image/png". Leaves out each value that is not known, such as the size of a file with no stored
 * object.
 */
export function formatFileMeta({
  filesize,
  height,
  mimeType,
  width,
}: {
  filesize?: null | number
  height?: null | number
  mimeType?: null | string
  width?: null | number
}): string {
  return [
    typeof filesize === 'number' ? formatFilesize(filesize) : null,
    typeof width === 'number' && typeof height === 'number' ? `${width}x${height}` : null,
    mimeType,
  ]
    .filter(Boolean)
    .join(' - ')
}
