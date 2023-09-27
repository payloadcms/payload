import { formatJSONPathSegment } from './formatJSONPathSegment'

export const convertPathToJSONTraversal = (path: string) => {
  const segments = path.split('.')
  segments.shift()

  return segments.reduce((res, segment, i) => {
    const formattedSegment = formatJSONPathSegment(segment)

    if (i + 1 === segments.length) return `${res}->>${formattedSegment}`
    return `${res}->${formattedSegment}`
  }, '')
}
