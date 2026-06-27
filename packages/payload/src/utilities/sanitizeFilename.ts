import sanitize from 'sanitize-filename'

import { APIError } from '../errors/APIError.js'

/**
 * Strips directory components and control characters from a filename,
 * leaving only the base filename.
 */
export function sanitizeFilename(filename: string): string {
  let sanitized = filename.replace(/\\/g, '/')

  const lastSlash = sanitized.lastIndexOf('/')
  if (lastSlash !== -1) {
    sanitized = sanitized.slice(lastSlash + 1)
  }

  if (sanitized === '.' || sanitized === '..') {
    sanitized = ''
  }

  // eslint-disable-next-line no-control-regex
  sanitized = sanitized.replace(/[\x00-\x1f\x80-\x9f]/g, '')

  const ext = sanitized.includes('.') ? sanitized.split('.').pop()?.split('?')[0] : ''
  const baseFilename = sanitize(sanitized.substring(0, sanitized.lastIndexOf('.')) || sanitized)

  sanitized = `${baseFilename}${ext ? `.${ext}` : ''}`

  if (!sanitized) {
    throw new APIError('Invalid filename', 400)
  }

  return sanitized
}
