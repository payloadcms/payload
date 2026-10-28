import path from 'path'

import type { Validate } from '../fields/config/types.js'

export const validateUploadFilename: Validate = (value: null | string | undefined) => {
  if (!value) {
    return true
  }

  const normalizedFilename = value.replaceAll('\\', '/')

  if (
    path.posix.isAbsolute(normalizedFilename) ||
    path.win32.isAbsolute(value) ||
    normalizedFilename.split('/').includes('..')
  ) {
    return 'Invalid filename'
  }

  return true
}
