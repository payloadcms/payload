export const convertPathToJSONTraversal = (incomingSegments: string[]): string => {
  const segments = [...incomingSegments]
  segments.shift()

  return segments.reduce((res, segment, i) => {
    const formattedSegment = Number.isNaN(parseInt(segment)) ? `'${segment}'` : segment
    const isLast = i === segments.length - 1
    return `${res}${isLast ? '->>' : '->'}${formattedSegment}`
  }, '')
}
