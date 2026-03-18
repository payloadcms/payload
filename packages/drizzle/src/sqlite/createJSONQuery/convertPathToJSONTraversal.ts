import { sanitizePathSegment } from '../../utilities/sanitizePathSegment.js'

export const convertPathToJSONTraversal = (incomingSegments: string[]): string => {
  const segments = [...incomingSegments]
  segments.shift()

  return segments.reduce((res, segment) => {
    const formattedSegment = Number.isNaN(parseInt(segment))
      ? `'${sanitizePathSegment(segment)}'`
      : segment
    return `${res}->>${formattedSegment}`
  }, '')
}
