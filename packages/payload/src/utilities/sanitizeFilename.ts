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

  if (!sanitized) {
    throw new APIError('Invalid filename', 400)
  }

  return sanitized
}
