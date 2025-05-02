import type { Validate } from '../fields/config/types.js'

import { validateMimeType } from '../utilities/validateMimeType.js'

export const mimeTypeValidator =
  (mimeTypes: string[]): Validate =>
  (val: string, { siblingData }) => {
    if (!siblingData.filename) {
      return true
    }

    if (!val) {
      return 'Invalid file type'
    }

    const isValidMimeType = validateMimeType(val, mimeTypes)
    return isValidMimeType ? true : `Invalid file type: '${val}'`
  }
