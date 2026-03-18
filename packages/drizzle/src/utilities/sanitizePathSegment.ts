import { APIError } from 'payload'

/**
 * Validates that a path segment contains only allowed characters (word characters: [a-zA-Z0-9_]).
 *
 * @throws {APIError} if the segment contains characters outside /^[\w]+$/
 */
const SAFE_PATH_SEGMENT_REGEX = /^\w+$/

export const sanitizePathSegment = (segment: string): string => {
  if (!SAFE_PATH_SEGMENT_REGEX.test(segment)) {
    throw new APIError(
      'Invalid path segment. Only alphanumeric characters and underscores are permitted.',
      400,
    )
  }
  return segment
}
