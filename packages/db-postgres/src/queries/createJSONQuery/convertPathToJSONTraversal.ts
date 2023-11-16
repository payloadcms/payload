import { formatJSONPathSegment } from './formatJSONPathSegment'

export const convertPathToJSONTraversal = (incomingSegments: string[]) => {
  const segments = [...incomingSegments]
  segments.shift()

  return segments.reduce((res, segment, i) => {
    const formattedSegment = formatJSONPathSegment(segment)

    if (i + 1 === segments.length) return `${res}->>${formattedSegment}`
    return `${res}->${formattedSegment}`
  }, '')
}
