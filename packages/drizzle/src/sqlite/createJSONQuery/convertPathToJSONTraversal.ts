import { parseJSONPathSegment } from '../../utilities/parseJSONPathSegment.js'

export const convertPathToJSONTraversal = (incomingSegments: string[]): string => {
  const segments = [...incomingSegments]
  segments.shift()

  return segments.reduce((res, segment, i) => {
    const parsedSegment = parseJSONPathSegment(segment)
    const formattedSegment =
      parsedSegment.type === 'objectKey' ? `'${parsedSegment.value}'` : parsedSegment.value
    const isLast = i === segments.length - 1
    return `${res}${isLast ? '->>' : '->'}${formattedSegment}`
  }, '')
}
