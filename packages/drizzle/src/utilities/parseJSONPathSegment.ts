import { sanitizePathSegment } from './sanitizePathSegment.js'

export type JSONPathSegment =
  | {
      type: 'arrayIndex'
      value: string
    }
  | {
      type: 'objectKey'
      value: string
    }

const ARRAY_INDEX_REGEX = /^\d+$/

export const parseJSONPathSegment = (segment: string): JSONPathSegment => {
  const sanitizedSegment = sanitizePathSegment(segment)

  if (ARRAY_INDEX_REGEX.test(sanitizedSegment)) {
    return {
      type: 'arrayIndex',
      value: sanitizedSegment,
    }
  }

  return {
    type: 'objectKey',
    value: sanitizedSegment,
  }
}
